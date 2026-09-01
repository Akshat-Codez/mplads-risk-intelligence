import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_one_page_pdf(filename="NIRMAN_MPLADS_Risk_Scoring_Methodology.pdf"):
    # Target 1-page Letter format with tight, elegant margins
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=0.45 * inch,
        rightMargin=0.45 * inch,
        topMargin=0.35 * inch,
        bottomMargin=0.35 * inch
    )

    styles = getSampleStyleSheet()
    
    # Custom compact styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_CENTER
    )

    sub_title_style = ParagraphStyle(
        'SubTitle',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e3a8a"),
        alignment=TA_CENTER
    )

    sec_heading = ParagraphStyle(
        'SecHeading',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=2
    )

    body_style = ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#334155")
    )

    bold_body = ParagraphStyle(
        'BoldBody',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0f172a")
    )

    formula_style = ParagraphStyle(
        'Formula',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e3a8a"),
        alignment=TA_CENTER
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("NIRMAN MPLADS RISK INTELLIGENCE SYSTEM", title_style))
    story.append(Paragraph("TECHNICAL METHODOLOGY & RISK FORMULA SPECIFICATION (MoSPI PS 102)", sub_title_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=5, spaceBefore=2))

    # 2. Section: Master Multi-Factor Integration Formula
    story.append(Paragraph("1. MULTI-FACTOR OVERALL RISK INTEGRATION FORMULA", sec_heading))
    
    formula_text = "<b>Overall Risk Score = (w<sub>f</sub> &times; Financial Risk) + (w<sub>p</sub> &times; Procurement Risk) + (w<sub>c</sub> &times; Contractor Risk)</b>"
    story.append(Paragraph(formula_text, formula_style))
    story.append(Spacer(1, 3))

    weight_data = [
        [
            Paragraph("<b>Scenario / Data Availability</b>", bold_body),
            Paragraph("<b>Financial (w<sub>f</sub>)</b>", bold_body),
            Paragraph("<b>Procurement (w<sub>p</sub>)</b>", bold_body),
            Paragraph("<b>Contractor (w<sub>c</sub>)</b>", bold_body),
            Paragraph("<b>Integration Rationale</b>", bold_body)
        ],
        [
            Paragraph("<b>Full Pipeline Active</b> (All 3 Pillars)", body_style),
            Paragraph("45%", body_style),
            Paragraph("35%", body_style),
            Paragraph("20%", body_style),
            Paragraph("Balanced multi-signal synthesis across price, vendor & expenditure.", body_style)
        ],
        [
            Paragraph("<b>No Tender / BOQ PDF Uploaded</b>", body_style),
            Paragraph("70%", body_style),
            Paragraph("0% (Deferred)", body_style),
            Paragraph("30%", body_style),
            Paragraph("Dynamic re-weighting avoids false negatives when BOQ is pending.", body_style)
        ],
        [
            Paragraph("<b>Financial Data Only</b>", body_style),
            Paragraph("100%", body_style),
            Paragraph("0%", body_style),
            Paragraph("0%", body_style),
            Paragraph("Evaluates purely on statistical anomalies & milestone delays.", body_style)
        ]
    ]

    t_weights = Table(weight_data, colWidths=[1.8*inch, 0.9*inch, 1.1*inch, 1.0*inch, 2.5*inch])
    t_weights.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t_weights)
    story.append(Spacer(1, 6))

    # 3. Section: Component Risk Engines Breakdown (3 Columns Table)
    story.append(Paragraph("2. THE THREE COMPONENT RISK ENGINES & INPUT PARAMETERS", sec_heading))

    engine_data = [
        [
            Paragraph("<b>A. Financial Anomaly Engine</b> (0–100)", bold_body),
            Paragraph("<b>B. Procurement & BOQ Engine</b> (0–100)", bold_body),
            Paragraph("<b>C. Contractor Network Engine</b> (0–100)", bold_body)
        ],
        [
            Paragraph(
                "<b>Model:</b> Isolation Forest (Contamination=0.08) + Heuristic Rules.<br/>"
                "<b>Formula:</b> <i>0.50 &times; S<sub>ML</sub> + 0.50 &times; S<sub>Rules</sub></i><br/><br/>"
                "<b>Core Parameters:</b><br/>"
                "&bull; <b>Sanction vs. Expenditure:</b> Cost ratio.<br/>"
                "&bull; <b>Sanction Delay:</b> Days between MP recommendation and DC sanction.<br/>"
                "&bull; <b>Completion Delay:</b> Duration vs. norms.<br/>"
                "&bull; <b>Category Z-Score:</b> Cost vs. sector mean.<br/>"
                "<b>Penalty Rules:</b><br/>"
                "&bull; Cost Overrun &gt; 15%: <b>+25 pts</b><br/>"
                "&bull; Sanction Delay &gt; 180 Days: <b>+20 pts</b><br/>"
                "&bull; Zero Spend on 'Completed': <b>+15 pts</b><br/>"
                "&bull; Threshold Ceiling Clustering: <b>+10 pts</b>",
                body_style
            ),
            Paragraph(
                "<b>Model:</b> CPWD Schedule of Rates (DSR) Baseline Comparative Engine.<br/>"
                "<b>Formula:</b> <i>Deviation % = (Quoted - CPWD) / CPWD &times; 100</i><br/><br/>"
                "<b>Weighted Sub-Components:</b><br/>"
                "&bull; <b>Rate Inflation (40%):</b> Volume-weighted price markup on steel, cement, bitumen, etc.<br/>"
                "&bull; <b>Peak Inflation Spike (30%):</b> Single line-item price spike &gt; +25%.<br/>"
                "&bull; <b>Unlisted Specifications (20%):</b> Generic descriptions bypassing CPWD standard item codes.<br/>"
                "&bull; <b>Budget Clustering (10%):</b> Tender price clustering within 0.5% of sanction limit.",
                body_style
            ),
            Paragraph(
                "<b>Model:</b> Geographic Concentration & Compatibility Network Profiler.<br/><br/>"
                "<b>Core Parameters & Scoring:</b><br/>"
                "&bull; <b>Geographic Monopoly (+30 pts):</b> Single vendor holding &gt; 40% of district works portfolio.<br/>"
                "&bull; <b>Type Incompatibility (+25 pts):</b> Domain mismatch (e.g., electrical firm executing civil road work).<br/>"
                "&bull; <b>Same-Day Clustering (+20 pts):</b> Multiple simultaneous sanctions to one vendor.<br/>"
                "&bull; <b>Stagnation / Delay Rate (+25 pts):</b> Historical non-completion track record across works.",
                body_style
            )
        ]
    ]

    t_engines = Table(engine_data, colWidths=[2.4*inch, 2.4*inch, 2.5*inch])
    t_engines.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#eff6ff")),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor("#fefce8")),
        ('BACKGROUND', (2, 0), (2, 0), colors.HexColor("#fdf2f8")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_engines)
    story.append(Spacer(1, 6))

    # 4. Section: Risk Level Classification Thresholds
    story.append(Paragraph("3. ADMINISTRATIVE ACTION CLASSIFICATION THRESHOLDS", sec_heading))

    threshold_data = [
        [
            Paragraph("<b>Risk Band</b>", bold_body),
            Paragraph("<b>Score Range</b>", bold_body),
            Paragraph("<b>Visual Tag</b>", bold_body),
            Paragraph("<b>Administrative Review Directive</b>", bold_body)
        ],
        [
            Paragraph("<b>HIGH RISK</b>", bold_body),
            Paragraph("<b>50.0 &ndash; 100.0</b>", bold_body),
            Paragraph("<font color='#b91c1c'><b>RED FLAG</b></font>", bold_body),
            Paragraph("<b>Mandatory Priority Review:</b> Trigger physical spot audit, expenditure freeze & BOQ verification.", body_style)
        ],
        [
            Paragraph("<b>MEDIUM RISK</b>", bold_body),
            Paragraph("<b>30.0 &ndash; 49.9</b>", bold_body),
            Paragraph("<font color='#d97706'><b>AMBER FLAG</b></font>", bold_body),
            Paragraph("<b>Secondary Documentary Scrutiny:</b> Monitor milestone timelines, vendor load & voucher trails.", body_style)
        ],
        [
            Paragraph("<b>LOW RISK</b>", bold_body),
            Paragraph("<b>0.0 &ndash; 29.9</b>", bold_body),
            Paragraph("<font color='#15803d'><b>GREEN</b></font>", bold_body),
            Paragraph("<b>Standard Workflow:</b> Normal project execution, routine quarterly administrative reporting.", body_style)
        ],
        [
            Paragraph("<b>INSUFFICIENT DATA</b>", bold_body),
            Paragraph("<i>N/A</i>", body_style),
            Paragraph("<font color='#64748b'><b>GRAY</b></font>", body_style),
            Paragraph("<b>Data Update Required:</b> Missing baseline records; does not falsely penalize project.", body_style)
        ]
    ]

    t_thresh = Table(threshold_data, colWidths=[1.3*inch, 1.0*inch, 1.1*inch, 3.9*inch])
    t_thresh.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(t_thresh)
    story.append(Spacer(1, 5))

    # Footer note
    footer_text = "<font size='6.5' color='#64748b'>NIRMAN MPLADS Risk Intelligence System &bull; Ministry of Statistics & Programme Implementation (MoSPI) &bull; Smart India Hackathon 2026</font>"
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', alignment=TA_CENTER)))

    doc.build(story)
    print(f"Successfully generated 1-page PDF: {filename}")

if __name__ == "__main__":
    create_one_page_pdf()
