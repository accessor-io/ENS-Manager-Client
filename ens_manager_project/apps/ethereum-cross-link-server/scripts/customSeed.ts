import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

export async function customSeed() {
  const client = new PrismaClient();
  const salt = await bcrypt.genSalt();
  
  try {
    // Create default admin user
    await client.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        password: await bcrypt.hash("admin123", salt),
        roles: ["admin"],
      },
    });
    
    console.log("Created default admin user");
  } catch (error) {
    console.error("Error creating default user:", error);
  } finally {
    await client.$disconnect();
  }
}
