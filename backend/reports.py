import io
import matplotlib.pyplot as plt
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

def generate_monthly_report(month: str):
    """
    Generates a PDF report for the given month.
    Includes a pie chart of Active vs Closed cases.
    Returns a BytesIO buffer containing the PDF.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, f"Monthly Report: {month}")

    # Generate Chart
    # Data for the chart (Mock data for now)
    labels = ['Active', 'Closed']
    sizes = [60, 40]
    colors = ['#4CAF50', '#F44336']

    plt.figure(figsize=(6, 4))
    plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=140)
    plt.axis('equal') # Equal aspect ratio ensures that pie is drawn as a circle.
    
    # Save chart to buffer
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png')
    img_buffer.seek(0)
    plt.close()

    # Draw chart on PDF
    img = ImageReader(img_buffer)
    c.drawImage(img, 50, height - 400, width=400, height=300)

    # Summary Table (Simple text for now)
    c.setFont("Helvetica", 12)
    y_position = height - 450
    c.drawString(50, y_position, "Details:")
    y_position -= 20
    c.drawString(50, y_position, f"Total Cases: {sum(sizes)}")
    y_position -= 20
    c.drawString(50, y_position, f"Active Cases: {sizes[0]}")
    y_position -= 20
    c.drawString(50, y_position, f"Closed Cases: {sizes[1]}")

    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer
