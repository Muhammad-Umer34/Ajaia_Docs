import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create demo users
  const alicePassword = await bcrypt.hash("password123", 10);
  const bobPassword = await bcrypt.hash("password123", 10);
  const charliePassword = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@ajaia.com" },
    update: { passwordHash: alicePassword },
    create: {
      name: "Alice Johnson",
      email: "alice@ajaia.com",
      passwordHash: alicePassword,
      avatarColor: "#6366f1",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@ajaia.com" },
    update: { passwordHash: bobPassword },
    create: {
      name: "Bob Smith",
      email: "bob@ajaia.com",
      passwordHash: bobPassword,
      avatarColor: "#ec4899",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@ajaia.com" },
    update: { passwordHash: charliePassword },
    create: {
      name: "Charlie Brown",
      email: "charlie@ajaia.com",
      passwordHash: charliePassword,
      avatarColor: "#f59e0b",
    },
  });

  // Create a sample document for Alice
  const doc1 = await prisma.document.create({
    data: {
      title: "Welcome to Ajaia Docs",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Welcome to Ajaia Docs" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is a lightweight collaborative document editor inspired by Google Docs. Try editing this document, creating new ones, or uploading files!",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Core Features" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", marks: [{ type: "bold" }], text: "Rich Text Editing: " },
                      { type: "text", text: "Format text with bold, italic, underline, headings, and lists." },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", marks: [{ type: "bold" }], text: "File Import: " },
                      { type: "text", text: "Upload .txt, .md, or .docx files to turn them into editable documents." },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", marks: [{ type: "bold" }], text: "Sharing & Access Control: " },
                      { type: "text", text: "Share documents with team members with view or edit permissions." },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      ownerId: alice.id,
    },
  });

  // Share doc1 with Bob (Edit access)
  await prisma.documentShare.upsert({
    where: {
      documentId_userId: {
        documentId: doc1.id,
        userId: bob.id,
      },
    },
    update: { permission: "edit" },
    create: {
      documentId: doc1.id,
      userId: bob.id,
      permission: "edit",
    },
  });

  // Create a document for Bob and share with Alice (View access)
  const doc2 = await prisma.document.create({
    data: {
      title: "Product Roadmap & Ideas",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Q3 Product Roadmap" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Drafting the initial roadmap for real-time collaboration and export features.",
              },
            ],
          },
        ],
      },
      ownerId: bob.id,
    },
  });

  await prisma.documentShare.upsert({
    where: {
      documentId_userId: {
        documentId: doc2.id,
        userId: alice.id,
      },
    },
    update: { permission: "view" },
    create: {
      documentId: doc2.id,
      userId: alice.id,
      permission: "view",
    },
  });

  console.log("✅ Seed data populated successfully!");
  console.log("------------------------------------------");
  console.log("Demo Accounts (Password: password123):");
  console.log("1. alice@ajaia.com   - Alice Johnson (Owner of Welcome Doc)");
  console.log("2. bob@ajaia.com     - Bob Smith (Owner of Roadmap Doc)");
  console.log("3. charlie@ajaia.com - Charlie Brown (Member)");
  console.log("------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
