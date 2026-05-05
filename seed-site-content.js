const prisma = require('./src/config/db');

const siteContent = [
  {
    page_slug: 'about',
    title: 'About Us',
    content: JSON.stringify({
      hero: {
        title: 'About TapToInvite',
        subtitle: 'Transforming how people celebrate life\'s special moments through technology and tradition'
      },
      mission: {
        heading: 'Our Mission',
        description: 'At TapToInvite, we believe that invitations should be more than just paper. They should be memorable, interactive, and genuinely delightful. We combine luxury physical craftsmanship with cutting-edge NFC technology to create invitation experiences that guests will never forget.'
      },
      story: {
        heading: 'Our Story',
        description: 'Founded in 2023, TapToInvite emerged from a simple observation: traditional invitations are beautiful but static. We asked ourselves—what if invitations could connect people instantly? What if a single tap could open a world of event details, RSVPs, and digital memories?\n\nToday, we\'ve helped thousands of hosts across India create unforgettable experiences. From intimate weddings to grand corporate events, our smart invitations have become the preferred choice for hosts who refuse to compromise on elegance or innovation.',
        points: [
          'Founded in 2023 with a vision to revolutionize invitations',
          'Partnered with premium card manufacturers globally',
          'Deployed NFC technology in 10,000+ smart invitations',
          'Trusted by event planners and luxury venues nationwide'
        ]
      },
      values: {
        heading: 'Our Core Values',
        items: [
          {
            title: 'Elegance',
            description: 'Every invitation is a work of art. We marry timeless design with modern technology.'
          },
          {
            title: 'Innovation',
            description: 'We constantly push boundaries to create experiences that didn\'t exist before.'
          },
          {
            title: 'Reliability',
            description: 'Your special day deserves flawless execution. We guarantee it.'
          },
          {
            title: 'Sustainability',
            description: 'Eco-friendly materials and responsible manufacturing are at our core.'
          }
        ]
      },
      team: {
        heading: 'Our Team',
        description: 'We\'re a team of designers, engineers, and event enthusiasts united by one goal: to make every invitation special. From our in-house design studio to our logistics partners, everyone in the TapToInvite ecosystem is committed to excellence.'
      },
      contact: {
        heading: 'Get in Touch',
        description: 'Have questions? We\'d love to hear from you. Reach out to our team anytime.',
        email: 'hello@taptoinvite.com',
        phone: '+91 98765 43210'
      }
    })
  },
  {
    page_slug: 'refund-policy',
    title: 'Refund Policy',
    content: JSON.stringify({
      hero: {
        title: 'Refund & Return Policy',
        subtitle: 'We stand behind our products 100%. Your satisfaction is our priority.'
      },
      sections: [
        {
          heading: '30-Day Money Back Guarantee',
          content: 'If you\'re not completely satisfied with your TapToInvite order within 30 days of delivery, we\'ll issue a full refund. No questions asked.',
          points: [
            'Full refund available within 30 days of delivery',
            'Product must be in original, unused condition',
            'Packaging must be intact and undamaged',
            'Return shipping is covered by us'
          ]
        },
        {
          heading: 'How to Request a Refund',
          content: 'Requesting a refund is easy:',
          points: [
            'Log into your account and navigate to Orders',
            'Select the order you wish to return',
            'Click "Request Refund" and provide your reason',
            'We\'ll send you a prepaid return label via email',
            'Ship the item back to us using the provided label',
            'Once received and inspected, we\'ll process your refund within 7 business days'
          ]
        },
        {
          heading: 'Partial Refunds',
          content: 'Partial refunds may be issued in the following cases:',
          points: [
            'Customization changes requested after printing has begun',
            'Minor damage due to user handling',
            'Custom digital content charges (non-refundable)'
          ]
        },
        {
          heading: 'Non-Refundable Items',
          content: 'The following are not eligible for refund:',
          points: [
            'Digital website hosting and customization services',
            'RSVP reminder subscriptions (annual plans)',
            'Rush delivery fees',
            'Items purchased more than 30 days ago',
            'Items with obvious signs of wear or damage'
          ]
        },
        {
          heading: 'Defective Products',
          content: 'If you receive a defective or damaged product, we\'ll replace it for free or issue a full refund. Simply contact our support team with photos of the defect within 7 days of delivery.',
          points: [
            'Contact us immediately upon receipt of damaged item',
            'Provide clear photos of the defect',
            'We\'ll issue a replacement or refund',
            'Return shipping label provided at no cost'
          ]
        },
        {
          heading: 'Shipping Issues',
          content: 'If your order arrives late or goes missing:',
          points: [
            'We track all orders until delivery confirmation',
            'If marked delivered but not received, we investigate immediately',
            'Replacement or refund issued based on carrier resolution',
            'For urgent events, express replacement available'
          ]
        },
        {
          heading: 'Refund Processing',
          content: 'Refunds are processed to your original payment method within 7-10 business days after we receive and inspect your return. Bank processing times may add an additional 3-5 business days.',
          points: [
            'Original refund method: same payment method used for purchase',
            'Processing time: 7-10 business days from receipt',
            'Bank processing: additional 3-5 business days',
            'Full transparency: you\'ll receive email updates at each stage'
          ]
        },
        {
          heading: 'Contact Us',
          content: 'Questions about our refund policy? We\'re here to help.',
          contact: {
            email: 'refunds@taptoinvite.com',
            phone: '+91 98765 43210',
            hours: 'Monday to Friday, 10 AM - 6 PM IST'
          }
        }
      ]
    })
  },
  {
    page_slug: 'terms',
    title: 'Terms & Conditions',
    content: JSON.stringify({
      hero: {
        title: 'Terms & Conditions',
        subtitle: 'Please read these terms carefully before using our services'
      },
      lastUpdated: 'May 2026',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          content: 'By accessing and using TapToInvite.com, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
        },
        {
          heading: '2. Use License',
          content: 'Permission is granted to temporarily download one copy of the materials (information or software) from TapToInvite for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:\n\n• Modify or copy the materials\n• Use the materials for any commercial purpose or for any public display\n• Attempt to decompile or reverse engineer any software contained on TapToInvite\n• Remove any copyright or other proprietary notations from the materials\n• Transfer the materials to another person or "mirror" the materials on any other server\n• Violate any applicable laws or regulations related to access to or use of the Services\n• Harass or cause distress or inconvenience to any person\n• Obscene or abusive language\n• Disrupt the normal flow of dialogue within our website'
        },
        {
          heading: '3. Disclaimer',
          content: 'The materials on TapToInvite\'s website are provided on an \'as is\' basis. TapToInvite makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.'
        },
        {
          heading: '4. Limitations',
          content: 'In no event shall TapToInvite or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TapToInvite\'s website, even if TapToInvite or a TapToInvite authorized representative has been notified orally or in writing of the possibility of such damage.'
        },
        {
          heading: '5. Accuracy of Materials',
          content: 'The materials appearing on TapToInvite could include technical, typographical, or photographic errors. TapToInvite does not warrant that any of the materials on its website are accurate, complete, or current. TapToInvite may make changes to the materials contained on its website at any time without notice.'
        },
        {
          heading: '6. Links',
          content: 'TapToInvite has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by TapToInvite of the site. Use of any such linked website is at the user\'s own risk.'
        },
        {
          heading: '7. Modifications',
          content: 'TapToInvite may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.'
        },
        {
          heading: '8. Governing Law',
          content: 'These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.'
        },
        {
          heading: '9. Intellectual Property Rights',
          content: 'All content on TapToInvite, including text, graphics, logos, images, and software, is the property of TapToInvite or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, transmit, display, or perform any content from this website for any purpose without prior written permission from TapToInvite.'
        },
        {
          heading: '10. User Responsibilities',
          content: 'You are responsible for all activities that occur under your account and you agree to comply with all applicable laws, rules, and regulations in relation to your access to and use of the Services. You further agree that you will not:\n\n• Engage in any conduct that restricts or inhibits anyone\'s use or enjoyment of the website\n• Post obscene or abusive content\n• Attempt to gain unauthorized access to the website or its systems\n• Engage in any form of harassment or abuse\n• Transmit any viruses, malware, or harmful code'
        },
        {
          heading: '11. Payment Terms',
          content: 'All prices are in Indian Rupees unless otherwise noted. Payment is due in full at the time of order placement. We accept all major credit cards and digital payment methods. Orders are subject to verification and acceptance. TapToInvite reserves the right to refuse or cancel any order.'
        },
        {
          heading: '12. Cancellation & Modifications',
          content: 'Orders can be cancelled within 24 hours of placement for a full refund. After 24 hours, the order cannot be cancelled but may be modified if still in the pre-production stage. Please contact our support team immediately for any requests.'
        },
        {
          heading: '13. Shipping & Delivery',
          content: 'Estimated delivery times are provided as guidance only and are not guaranteed. TapToInvite is not responsible for delays caused by courier services or circumstances beyond our control. All items are insured during transit. Any damage claims must be filed within 7 days of delivery.'
        },
        {
          heading: '14. Privacy',
          content: 'Your use of TapToInvite is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.'
        },
        {
          heading: '15. Contact Information',
          content: 'If you have any questions about these Terms & Conditions, please contact us at:\n\nEmail: legal@taptoinvite.com\nPhone: +91 98765 43210\nAddress: TapToInvite, Bangalore, India'
        }
      ]
    })
  },
  {
    page_slug: 'contact',
    title: 'Contact Us',
    content: JSON.stringify({
      hero: {
        title: 'Get in Touch',
        subtitle: 'Have questions about our NFC technology or a custom order? Our concierge team is here to help.'
      },
      contacts: [
        {
          type: 'Email',
          icon: 'Mail',
          label: 'Email Us',
          value: 'tap@taptoinvite.in',
          link: 'mailto:tap@taptoinvite.in'
        },
        {
          type: 'Phone',
          icon: 'Phone',
          label: 'Call Us',
          value: '+91 98765 43210',
          link: 'tel:+919876543210'
        },
        {
          type: 'Address',
          icon: 'MapPin',
          label: 'Office',
          value: 'Innovation Hub, MG Road, Bangalore',
          link: null
        }
      ],
      form: {
        title: 'Send us a Message',
        description: 'Fill out the form below and we\'ll get back to you within 24 hours.',
        fields: [
          {
            name: 'name',
            label: 'Name',
            placeholder: 'Your name',
            type: 'text',
            required: true
          },
          {
            name: 'email',
            label: 'Email',
            placeholder: 'email@example.com',
            type: 'email',
            required: true
          },
          {
            name: 'subject',
            label: 'Subject',
            placeholder: 'How can we help?',
            type: 'text',
            required: true
          },
          {
            name: 'message',
            label: 'Message',
            placeholder: 'Tell us more about your event...',
            type: 'textarea',
            required: true
          }
        ]
      },
      responseMessage: {
        success: 'Message Sent!',
        description: 'We\'ll get back to you within 24 hours.'
      }
    })
  }
];

async function seedSiteContent() {
  try {
    console.log('Starting site content seeding...');

    for (const content of siteContent) {
      const existing = await prisma.siteContent.findFirst({
        where: { page_slug: content.page_slug }
      });

      if (existing) {
        // Update existing
        await prisma.siteContent.update({
          where: { id: existing.id },
          data: {
            title: content.title,
            content: content.content,
            last_updated_by: 1 // System/Admin
          }
        });
        console.log(`✓ Updated: ${content.page_slug}`);
      } else {
        // Create new
        await prisma.siteContent.create({
          data: {
            page_slug: content.page_slug,
            title: content.title,
            content: content.content,
            content_key: content.page_slug,
            last_updated_by: 1 // System/Admin
          }
        });
        console.log(`✓ Created: ${content.page_slug}`);
      }
    }

    console.log('✓ Site content seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding site content:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSiteContent();
