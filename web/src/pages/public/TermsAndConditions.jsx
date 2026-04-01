import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Clock,
  Receipt,
  WarningCircle,
  CreditCard,
  ShieldCheck,
  CaretLeft
} from '@phosphor-icons/react';

const TermsAndConditions = () => {
  const { hash } = useLocation();
  const [activeSection, setActiveSection] = useState('check-in-out');

  useEffect(() => {
    if (hash) {
      setActiveSection(hash.replace('#', ''));
      const section = document.getElementById(hash.replace('#', ''));
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    window.scrollTo(0, 0);
  }, [hash]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) {
          return;
        }

        const closestToTop = visibleEntries.sort(
          (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top),
        )[0];

        setActiveSection(closestToTop.target.id);
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  const policies = [
    {
      id: 'check-in-out',
      icon: <Clock size={24} weight="light" className="text-orange-800" />,
      title: 'Check-In & Check-Out',
      content: (
        <div className="space-y-4 text-sm font-light text-gray-600 leading-relaxed">
          <p>
            <strong className="font-medium text-gray-900">Check-in time:</strong> From 14:00 (2:00 PM) local time. Early check-in is subject to availability and may incur additional charges. Guests are required to present a valid government-issued ID or passport upon arrival.
          </p>
          <p>
            <strong className="font-medium text-gray-900">Check-out time:</strong> Until 12:00 (12:00 PM) local time. Late check-out requests must be made in advance and are subject to property approval. Unapproved late check-outs will be charged at 50% of the daily room rate until 18:00, and 100% thereafter.
          </p>
        </div>
      ),
    },
    {
      id: 'payment',
      icon: <CreditCard size={24} weight="light" className="text-orange-800" />,
      title: 'Payment & Reservations',
      content: (
        <div className="space-y-4 text-sm font-light text-gray-600 leading-relaxed">
          <p>
            <strong className="font-medium text-gray-900">15-Minute Payment Window:</strong> Once a reservation is initiated, the selected rooms are temporarily held for 15 minutes. If payment is not completed within this timeframe, the reservation will automatically expire (Status: Expired) and the rooms will be released.
          </p>
          <p>
            <strong className="font-medium text-gray-900">Accepted Methods:</strong> We accept major credit cards, debit cards, and secure online payment gateways (e.g., VNPay). All transactions are encrypted and processed securely.
          </p>
          <p>
            <strong className="font-medium text-gray-900">Taxes & Fees:</strong> All displayed rates are inclusive of applicable VAT and service charges unless stated otherwise.
          </p>
        </div>
      ),
    },
    {
      id: 'cancellation',
      icon: <Receipt size={24} weight="light" className="text-orange-800" />,
      title: 'Cancellation & Refund Policy',
      content: (
        <div className="space-y-4 text-sm font-light text-gray-600 leading-relaxed">
          <p>
            We understand that plans change. Our cancellation policy is designed to be fair to both our guests and our properties.
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong className="font-medium text-gray-900">Standard Cancellation:</strong> Guests may request a cancellation via their Guest Portal. Cancellations requested <strong className="font-medium text-gray-900">at least 24 hours prior</strong> to the scheduled check-in time are eligible for a full refund.</li>
            <li><strong className="font-medium text-gray-900">Late Cancellation:</strong> Requests made within 24 hours of check-in, or after the check-in date has passed, may not be eligible for a refund, subject to the property's specific rate conditions.</li>
            <li><strong className="font-medium text-gray-900">No-Show Policy:</strong> If you fail to arrive on your scheduled check-in date without prior notice, your reservation will be marked as "No Show". The total booking amount will be forfeited, and remaining nights will be cancelled.</li>
          </ul>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-4 border-t border-gray-100 pt-4">
            * Refunds are processed back to the original payment method and may take 5-10 business days to appear in your account.
          </p>
        </div>
      ),
    },
    {
      id: 'property-rules',
      icon: <WarningCircle size={24} weight="light" className="text-orange-800" />,
      title: 'Property Rules & Conduct',
      content: (
        <div className="space-y-4 text-sm font-light text-gray-600 leading-relaxed">
          <p>
            To ensure a luxurious and peaceful environment for all guests, we strictly enforce the following rules:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="font-medium text-gray-900">Smoke-Free Environment:</strong> All rooms and indoor public areas are 100% smoke-free. A deep-cleaning fee will be charged for smoking indoors.</li>
            <li><strong className="font-medium text-gray-900">Quiet Hours:</strong> Please observe quiet hours from 22:00 to 07:00 to respect other guests' rest.</li>
            <li><strong className="font-medium text-gray-900">Pet Policy:</strong> While we love animals, pets are not allowed on the premises unless they are certified service animals (documentation required).</li>
            <li><strong className="font-medium text-gray-900">Damages:</strong> Guests are liable for any damages to property furnishings, fixtures, or equipment caused by themselves or their visitors.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'privacy',
      icon: <ShieldCheck size={24} weight="light" className="text-orange-800" />,
      title: 'Privacy & Data Protection',
      content: (
        <div className="space-y-4 text-sm font-light text-gray-600 leading-relaxed">
          <p>
            Roomerang respects your privacy. Personal information collected during the booking process (name, email, phone number, payment details) is used strictly for reservation management, communication regarding your stay, and legal compliance.
          </p>
          <p>
            We do not sell or share your personal data with unauthorized third parties. For a complete overview of how we handle your data, please request our full Privacy Policy document at the front desk.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCFA] pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
        
        {/* Navigation & Header */}
        <div className="mb-16 text-center sm:text-left">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-orange-800 transition-colors mb-8"
          >
            <CaretLeft size={14} /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
            Terms & Conditions
          </h1>
          <p className="text-sm font-light text-gray-500 max-w-2xl">
            Please read these terms carefully before using our services. By proceeding with a reservation, you agree to comply with the policies outlined below.
          </p>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          
          {/* Left Column: Quick Navigation (Sticky) */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 mb-6 font-medium">Contents</h3>
              <ul className="space-y-4 border-l border-gray-200">
                {policies.map((policy) => (
                  <li key={`nav-${policy.id}`}>
                    <a
                      href={`#${policy.id}`}
                      onClick={() => setActiveSection(policy.id)}
                      aria-current={activeSection === policy.id ? 'location' : undefined}
                      className={`block pl-4 text-xs border-l-2 transition-all -ml-[1px] ${
                        activeSection === policy.id
                          ? 'font-medium text-orange-800 border-orange-800'
                          : 'font-light text-gray-500 border-transparent hover:text-orange-800 hover:border-orange-800'
                      }`}
                    >
                      {policy.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Policies Details */}
          <div className="flex-1 space-y-16">
            {policies.map((policy) => (
              <section key={policy.id} id={policy.id} className="scroll-mt-24">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    {policy.icon}
                  </div>
                  <h2 className="text-2xl font-serif text-gray-900">
                    {policy.title}
                  </h2>
                </div>
                <div className="pl-0 sm:pl-16">
                  {policy.content}
                </div>
              </section>
            ))}

            {/* Footer Note */}
            <div className="pl-0 sm:pl-16 pt-8 mt-8 border-t border-gray-200">
              <p className="text-xs font-light text-gray-500 italic">
                Last updated: April 2024. Roomerang reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;