const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles.filter(file => file.endsWith('.jsx'));
}

const files = getAllFiles(directoryPath);

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Process <NeonCard> imported from components/NeonCard
  if (content.includes('NeonCard') && filePath.includes('Dashboard')) {
      // It's easier to just let NeonCard.jsx be the wrapper for those files.
  }

  // Find <div ... class="neon-card" or className="neon-card"
  const regex = /<div([^>]*className=["'{`][^"'{`]*neon-card[^"'{`]*["'`}][^>]*)>/g;
  
  let match;
  let newContent = content;
  let offset = 0;

  // Find all matches sequentially
  const matches = [];
  while ((match = regex.exec(content)) !== null) {
      matches.push({
          start: match.index,
          end: match.index + match[0].length,
          fullMatch: match[0],
          innerAttr: match[1]
      });
  }

  // Process from right to left to avoid offset issues
  matches.reverse().forEach(m => {
      // Find matching closing </div>
      let openDivs = 1;
      let i = m.end;
      let closeIdx = -1;

      while (i < content.length) {
          if (content.slice(i, i + 4) === '<div') {
              openDivs++;
              i += 4;
          } else if (content.slice(i, i + 6) === '</div>') {
              openDivs--;
              if (openDivs === 0) {
                  closeIdx = i;
                  break;
              }
              i += 6;
          } else {
              i++;
          }
      }

      if (closeIdx !== -1) {
          // Construct replacement
          const beforeStr = content.slice(0, m.start);
          const afterStr = content.slice(closeIdx + 6);
          const innerContent = content.slice(m.end, closeIdx);
          
          let replacementTag = `<GlowCard${m.innerAttr} customSize={true}>`;
          
          content = beforeStr + replacementTag + innerContent + '</GlowCard>' + afterStr;
          changed = true;
      }
  });

  if (changed) {
      // Figure out import path
      let importPath = "import { GlowCard } from './components/GlowCard';";
      const parts = filePath.split(path.sep);
      const srcIdx = parts.indexOf('src');
      const depth = parts.length - srcIdx - 2; // -1 for filename, -1 for src itself
      
      if (depth === 0) {
          importPath = "import { GlowCard } from './components/GlowCard';";
      } else if (depth === 1) {
          importPath = "import { GlowCard } from '../components/GlowCard';";
      } else if (depth === 2) {
          importPath = "import { GlowCard } from '../../components/GlowCard';";
      }
      
      // Inject import if not present
      if (!content.includes('GlowCard')) {
          // Find first import
          const firstImport = content.indexOf('import ');
          if (firstImport !== -1) {
              content = content.slice(0, firstImport) + importPath + '\n' + content.slice(firstImport);
          } else {
              content = importPath + '\n' + content;
          }
      }

      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Modified:', filePath);
  }
}

files.forEach(replaceInFile);
console.log('Done!');
