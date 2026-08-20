import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { sendEmail, escapeHtml } from "@/server/services/emailService";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const opportunityIdParam = (formData.get("opportunityId") || "").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const role = (formData.get("role") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();
    const opportunityTitle = (formData.get("opportunityTitle") || "").toString().trim();
    const opportunityCompany = (formData.get("opportunityCompany") || "").toString().trim();
    const opportunityType = (formData.get("opportunityType") || "").toString().trim();
    const opportunityLocation = (formData.get("opportunityLocation") || "").toString().trim();
    const resume = formData.get("resume");

    // Honeypot: real users never fill this hidden field.
    if ((formData.get("website") || "").toString().trim()) {
      return NextResponse.json(
        { error: "Submission rejected." },
        { status: 400 }
      );
    }

    if (!fullName || !email || !role) {
      return NextResponse.json(
        { error: "fullName, email, and role are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!resume || typeof resume === "string") {
      return NextResponse.json(
        { error: "Resume file is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(resume.type)) {
      return NextResponse.json(
        { error: "Resume must be a PDF or Word document" },
        { status: 400 }
      );
    }

    if (resume.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Resume must be under 5MB" },
        { status: 400 }
      );
    }

    // Resolve or find the target opportunity in database
    let targetOpportunity = null;
    if (opportunityIdParam) {
      targetOpportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityIdParam },
      });
    }

    if (!targetOpportunity && opportunityTitle) {
      targetOpportunity = await prisma.opportunity.findFirst({
        where: {
          title: { equals: opportunityTitle, mode: "insensitive" },
        },
      });
    }

    // If still not found, create a fallback record so application is preserved
    if (!targetOpportunity) {
      targetOpportunity = await prisma.opportunity.create({
        data: {
          title: opportunityTitle || "General Opportunity",
          company: opportunityCompany || "Partner Organization",
          type: opportunityType || "Full-time",
          location: opportunityLocation || "Remote",
          description: "Auto-registered via application submission",
          tags: JSON.stringify(["General"]),
          status: "ACTIVE",
        },
      });
    }

    const fileBuffer = Buffer.from(await resume.arrayBuffer());
    const resumeDataUrl = `data:${resume.type || "application/pdf"};base64,${fileBuffer.toString("base64")}`;

    // Persist application in database
    const application = await prisma.opportunityApplication.create({
      data: {
        opportunityId: targetOpportunity.id,
        fullName,
        email,
        phone: phone || null,
        role,
        message: message || null,
        resumeName: resume.name,
        resumeUrl: resumeDataUrl,
        status: "PENDING",
      },
    });

    // Attempt to send email notification (non-blocking failure)
    try {
      await sendEmail({
        subject: `New Opportunity Application — ${escapeHtml(targetOpportunity.title || opportunityTitle)}`,
        html: `
          <h2>New Opportunity Application</h2>
          <h3>Opportunity</h3>
          <p><strong>Title:</strong> ${escapeHtml(targetOpportunity.title || opportunityTitle)}</p>
          <p><strong>Company:</strong> ${escapeHtml(targetOpportunity.company || opportunityCompany)}</p>
          <p><strong>Type:</strong> ${escapeHtml(targetOpportunity.type || opportunityType)}</p>
          <p><strong>Location:</strong> ${escapeHtml(targetOpportunity.location || opportunityLocation)}</p>
          <br/>
          <h3>Applicant</h3>
          <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${phone ? escapeHtml(phone) : "N/A"}</p>
          <p><strong>Role:</strong> ${escapeHtml(role)}</p>
          <br/>
          <p><strong>Message:</strong></p>
          <p>${message ? escapeHtml(message) : "N/A"}</p>
        `,
        attachments: [
          {
            filename: resume.name,
            content: fileBuffer.toString("base64"),
          },
        ],
      });
    } catch (emailErr) {
      console.warn("Notice: Email notification dispatch failed or credentials unconfigured:", emailErr?.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.id,
        opportunityId: targetOpportunity.id,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
