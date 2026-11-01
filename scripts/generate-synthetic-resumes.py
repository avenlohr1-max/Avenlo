"""Small, valid resume fixtures; contains no real candidate information."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape

destination = Path("test-results/resume-fixtures")
destination.mkdir(parents=True, exist_ok=True)
lines = ["Synthetic Candidate", "synthetic@example.test", "Summary",
         "Reporting analyst with SQL and Python experience.", "Experience",
         "Built reporting systems and improved processing by 25 percent.",
         "Skills", "SQL Python Excel Communication", "Education",
         "Example University Bachelor of Science"]
stream = "BT /F1 12 Tf 50 760 Td 18 TL\n" + "\n".join(
    "(" + text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") + ") Tj T*"
    for text in lines) + "\nET"
objects = [b"<< /Type /Catalog /Pages 2 0 R >>",
           b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
           b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
           b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
           (f"<< /Length {len(stream.encode('ascii'))} >>\nstream\n{stream}\nendstream").encode("ascii")]
pdf = bytearray(b"%PDF-1.4\n")
offsets = [0]
for number, obj in enumerate(objects, 1):
    offsets.append(len(pdf))
    pdf.extend(f"{number} 0 obj\n".encode() + obj + b"\nendobj\n")
xref = len(pdf)
pdf.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
for offset in offsets[1:]:
    pdf.extend(f"{offset:010d} 00000 n \n".encode())
pdf.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
(destination / "synthetic.pdf").write_bytes(pdf)
with ZipFile(destination / "synthetic.docx", "w", ZIP_DEFLATED) as docx:
    docx.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
    docx.writestr("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
    paragraphs = "".join(f"<w:p><w:r><w:t>{escape(text)}</w:t></w:r></w:p>" for text in lines)
    docx.writestr("word/document.xml", f'<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{paragraphs}<w:sectPr/></w:body></w:document>')
