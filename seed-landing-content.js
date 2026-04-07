const prisma = require('./src/config/db');

const landingPageContent = {
  hero: [
    {
      key: 'HeroSection-Title',
      value: 'The Smart Invitation'
    },
    {
      key: 'HeroSection-Highlight',
      value: 'Smart'
    },
    {
      key: 'HeroSection-Subtitle',
      value: 'TapToInvite bridges the physical and digital. Share your event details instantly with a simple tap. No apps, no friction, pure magic.'
    }
  ],
  collections: [],
  collectionsData: [
    {
      id: '1',
      title: "Luxury Gold",
      subtitle: "Smart Wedding Cards",
      description: "Premium gold-plated finish with integrated NFC tech. The ultimate statement for high-end weddings.",
      podiumColor: "bg-amber-400",
      accentColor: "bg-primary",
      darkCard: true,
      image: ""
    },
    {
      id: '2',
      title: "Sleek Silver",
      subtitle: "Corporate Invitations",
      description: "Modern silver aesthetic designed for corporate elegance. Secure and incredibly fast guest check-ins.",
      podiumColor: "bg-slate-300",
      accentColor: "bg-slate-200",
      darkCard: false,
      image: ""
    },
    {
      id: '3',
      title: "Eco Wood",
      subtitle: "Natural Series",
      description: "Handcrafted bamboo with embedded NFC. Sustainable luxury for the environmentally conscious host.",
      podiumColor: "bg-green-200",
      accentColor: "bg-green-100",
      darkCard: false,
      image: ""
    }
  ],
  benefits: [],
  benefitsData: [
    {
      id: '1',
      title: "Unmatched Durability",
      description: "Made from premium, durable materials, our smart invitations outlast traditional paper cards and stay perfect forever.",
      icon: 'ShieldCheck'
    },
    {
      id: '2',
      title: "Exclusive Custom Smart Invitation",
      description: "Get the best customizable smart invitation that combines sleek design and deep personalization for your event.",
      icon: 'Target'
    },
    {
      id: '3',
      title: "Advanced NFC Technology",
      description: "Experience seamless sharing with cutting-edge chips that guarantee connectivity on any compatible device instantly.",
      icon: 'Zap'
    },
    {
      id: '4',
      title: "Quick Delivery",
      description: "Swiftly receive your smart invitations with tap-to-connect feature, delivered on time without any delays.",
      icon: 'Truck'
    }
  ],
  steps: [],
  stepsData: [
    {
      id: '1',
      number: '1',
      title: "Select Package",
      description: "Choose from Classic, Premium, or the highly flexible Freedom Plan based on your guest list.",
      icon: 'MousePointer2'
    },
    {
      id: '2',
      number: '2',
      title: "Pick Templates",
      description: "Select designs for both NFC and physical cards. Mix and match multiple styles for different guest tiers.",
      icon: 'Palette'
    },
    {
      id: '3',
      number: '3',
      title: "Provide Details",
      description: "Enter your event info and delivery address. Our AI can even help write your invitation content.",
      icon: 'ClipboardList'
    },
    {
      id: '4',
      number: '4',
      title: "Secure Order",
      description: "Pay a 30% advance to start production. We'll contact you to confirm everything within 24 hours.",
      icon: 'CreditCard'
    }
  ],
  testimonials: [],
  testimonialsData: [
    {
      id: '1',
      name: "Sarah & Michael",
      event: "Wedding",
      content: "The NFC cards were the highlight of our wedding! Our guests loved how easy it was to find the location and RSVP instantly.",
      rating: 5,
      image: ""
    },
    {
      id: '2',
      name: "Jason Rivera",
      event: "Corporate Launch",
      content: "TapToInvite transformed our event check-in. Professional, sleek, and high-tech. It made a massive impression.",
      rating: 5,
      image: ""
    },
    {
      id: '3',
      name: "The Kapoors",
      event: "House Warming",
      content: "Beautiful physical cards combined with a stunning digital page. The AI content generator saved us so much time.",
      rating: 5,
      image: ""
    }
  ]
};

async function seedLandingContent() {
  try {
    console.log('Starting to seed landing page content...');

    // Check if content already exists
    const existingContent = await prisma.siteContent.findFirst({
      where: {
        page_slug: 'landing',
        content_key: 'landing'
      }
    });

    if (existingContent) {
      console.log('Landing page content already exists. Updating...');
      
      const updated = await prisma.siteContent.update({
        where: { id: existingContent.id },
        data: {
          title: 'Landing Page Content',
          content: JSON.stringify(landingPageContent),
          last_updated_by: 1, // Admin user ID
          updated_at: new Date()
        }
      });

      console.log('✓ Landing page content updated successfully!');
      console.log('Record:', updated);
    } else {
      console.log('Creating new landing page content...');
      
      const created = await prisma.siteContent.create({
        data: {
          page_slug: 'landing',
          content_key: 'landing',
          title: 'Landing Page Content',
          content: JSON.stringify(landingPageContent),
          last_updated_by: 1 // Admin user ID
        }
      });

      console.log('✓ Landing page content created successfully!');
      console.log('Record:', created);
    }

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding landing content:', error);
    process.exit(1);
  }
}

seedLandingContent();
