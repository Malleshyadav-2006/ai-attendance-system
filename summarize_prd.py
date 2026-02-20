import re

def summarize_prd(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        summary = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            line = line.strip()
            # Capture headers
            if line.startswith('#') or (len(line) > 0 and line[0].isdigit() and '.' in line[:5]):
                summary.append(f"\n[HEADER] {line}")
                # Capture next 2 non-empty lines
                count = 0
                for next_line in lines[i+1:]:
                    if next_line.strip():
                        summary.append(f"  > {next_line.strip()[:100]}...")
                        count += 1
                    if count >= 2:
                        break
            # Capture key feature keywords
            if 'Feature' in line or 'Requirement' in line or 'New' in line:
                 summary.append(f"[KEYWORD] {line[:100]}")

        with open('prd_summary.md', 'w', encoding='utf-8') as f:
            f.write('\n'.join(summary))
            
        print("Summary written to prd_summary.md")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    summarize_prd('simple_prd.txt')
