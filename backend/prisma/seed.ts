import { PrismaClient, HabitCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaultClubs: Array<{ name: string; slug: string; category: HabitCategory; description: string; minStreak: number }> = [
    { name: "7-Day Club", slug: "7-day-club", category: "coding", description: "You hit a 7-day streak.", minStreak: 7 },
    { name: "30-Day Warriors", slug: "30-day-warriors", category: "gym", description: "30 days of consistent training.", minStreak: 30 },
    { name: "Century Readers", slug: "century-readers", category: "reading", description: "100 days reading.", minStreak: 100 },
    { name: "Mindful Hundred", slug: "mindful-hundred", category: "meditation", description: "100 days of meditation.", minStreak: 100 },
  ];

  // Need a creator user for seeded clubs
  const seedUser = await prisma.user.upsert({
    where: { email: "system@consitrack.app" },
    update: {},
    create: {
      email: "system@consitrack.app",
      emailVerified: true,
      profile: {
        create: {
          username: "system",
          displayName: "ConsiTrack",
        },
      },
    },
  });

  for (const c of defaultClubs) {
    await prisma.club.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, creatorId: seedUser.id },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
