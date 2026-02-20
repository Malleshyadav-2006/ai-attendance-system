import docx
import os

docx_path = r"c:\Users\balakrishnayadav\OneDrive\Desktop\ignite\AI_Smart_Attendance_Enhanced_PRD.docx"

if not os.path.exists(docx_path):
    print(f"File not found: {docx_path}")
    exit(1)

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    doc = docx.Document(docx_path)
    print(f"# Content of {os.path.basename(docx_path)}\n")
    for para in doc.paragraphs:
        if para.text.strip():
            print(para.text)
            print("")
except Exception as e:
    print(f"Error reading docx: {e}")
