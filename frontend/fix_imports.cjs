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

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('<GlowCard') && !content.includes('import { GlowCard }')) {
    let importPath = "import { GlowCard } from './components/GlowCard';";
    const parts = filePath.split(path.sep);
    const srcIdx = parts.indexOf('src');
    const depth = parts.length - srcIdx - 2;
    
    if (depth === 0) {
        importPath = "import { GlowCard } from './components/GlowCard';";
    } else if (depth === 1) {
        importPath = "import { GlowCard } from '../components/GlowCard';";
    } else if (depth === 2) {
        importPath = "import { GlowCard } from '../../components/GlowCard';";
    }
    
    // ignore GlowCard.jsx itself just in case
    if (!filePath.endsWith('GlowCard.jsx')) {
        const firstImport = content.indexOf('import ');
        if (firstImport !== -1) {
            content = content.slice(0, firstImport) + importPath + '\n' + content.slice(firstImport);
        } else {
            content = importPath + '\n' + content;
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed imports:', filePath);
    }
  }
});
