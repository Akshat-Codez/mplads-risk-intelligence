import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_sample_boq(output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 80, "BRUHAT BENGALURU MAHANAGARA PALIKE (BBMP)")
    c.setFont("Helvetica", 10)
    c.drawString(100, height - 100, "OFFICE OF THE EXECUTIVE ENGINEER, JAYANAGAR DIVISION")
    c.drawString(100, height - 115, "TENDER CALL NOTICE & BILL OF QUANTITIES (BOQ)")

    # Tender Meta Info
    c.setFont("Helvetica-Bold", 11)
    c.drawString(100, height - 160, "Tender Reference Number: TENDER-KA-BLR-086-2025")
    c.drawString(100, height - 180, "Date: 2025-10-15")
    c.drawString(100, height - 200, "Project Name: Bangalore Urban District Jayanagar Vidhanasabha Road Concrete Construction Work")
    c.drawString(100, height - 220, "Contractor/Vendor: N G GANESH BABU")
    c.drawString(100, height - 240, "Total Estimated Cost: Rs. 2,500,000.00")
    c.drawString(100, height - 260, "Total Quoted Bid Value: Rs. 3,120,000.00")

    # Table Header
    c.setFont("Helvetica-Bold", 10)
    c.drawString(100, height - 310, "Item Name & Specifications")
    c.drawString(300, height - 310, "Qty")
    c.drawString(350, height - 310, "Unit")
    c.drawString(400, height - 310, "Estimated Price")
    c.drawString(490, height - 310, "Quoted Price")

    # Items
    items = [
        ("Cement (OPC 43 Grade)", "1000", "bag", "Rs. 400.00", "Rs. 550.00"),
        ("Reinforcement Steel (Fe 500)", "5000", "kg", "Rs. 60.00", "Rs. 85.00"),
        ("Concrete M20 Grade", "120", "cum", "Rs. 4400.00", "Rs. 4600.00"),
        ("Unskilled Labor", "200", "day", "Rs. 430.00", "Rs. 440.00"),
    ]

    y_pos = height - 330
    c.setFont("Helvetica", 9)
    for name, qty, unit, est, quot in items:
        c.drawString(100, y_pos, name)
        c.drawString(300, y_pos, qty)
        c.drawString(350, y_pos, unit)
        c.drawString(400, y_pos, est)
        c.drawString(490, y_pos, quot)
        y_pos -= 20

    # Footer
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(100, 100, "Note: This is a digital BOQ document submitted for internal validation.")
    
    c.save()
    print(f"Sample PDF successfully created at: {output_path}")

if __name__ == "__main__":
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output = os.path.join(root_dir, "uploads", "sample_boq.pdf")
    os.makedirs(os.path.dirname(output), exist_ok=True)
    create_sample_boq(output)
