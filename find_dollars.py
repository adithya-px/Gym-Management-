import os, glob

for f in glob.glob('C:/Code/gym_management/frontend/src/**/*.jsx', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for i, line in enumerate(lines):
            line_s = line.strip()
            # Find literal dollars used as money symbols
            if '($)' in line_s:
                print(f'{f}:{i+1}:{line_s}')
            elif '>$' in line_s:
                print(f'{f}:{i+1}:{line_s}')
            elif '`$$' in line_s:
                print(f'{f}:{i+1}:{line_s}')
            elif '"$' in line_s or '=$' in line_s or ' $' in line_s:
                # possible JSX literal text node or string
                if '${' not in line_s.split('$', 1)[-1]:
                    pass # just a single dollar without interpolation maybe?
                if ' $' in line_s and not line_s.startswith('//'):
                    print(f'{f}:{i+1}:{line_s}')
            elif '${' in line_s and not line_s.startswith('//'):
                # Check for `>${var}` or similar patterns that might be missing
                # e.g., <td ...>${value}</td>
                parts = line_s.split('$')
                for part in parts[:-1]:
                    if part.endswith('>') or part.endswith('"') or part.endswith("'") or part.endswith('{'):
                        # e.g. }>${value} or {"$"}{value}
                        if not '`' in part:
                           pass
                pass
