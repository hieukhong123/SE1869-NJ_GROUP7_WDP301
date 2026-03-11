import { Link } from 'react-router-dom';
import {
    BuildingsIcon,
    HeartIcon,
    ShieldCheckIcon,
    UsersThreeIcon,
    AirplaneIcon,
    ChartLineUpIcon,
    SparkleIcon,
    CheckCircleIcon,
    ArrowRightIcon
} from '@phosphor-icons/react';

const AboutUs = () => {
    const stats = [
        { icon: BuildingsIcon, value: '500+', label: 'Partner Properties' },
        { icon: UsersThreeIcon, value: '50K+', label: 'Distinguished Guests' },
        { icon: AirplaneIcon, value: '15+', label: 'Destinations' },
        { icon: ChartLineUpIcon, value: '98%', label: 'Satisfaction Rate' },
    ];

    // Đã loại bỏ các thuộc tính color/bg không cần thiết cho thiết kế tối giản
    const values = [
        {
            icon: ShieldCheckIcon,
            title: 'Trust & Privacy',
            description: 'We prioritize your security with verified luxury properties and uncompromising privacy standards.',
        },
        {
            icon: HeartIcon,
            title: 'Guest First',
            description: 'Your satisfaction is our signature. We anticipate needs and exceed expectations.',
        },
        {
            icon: SparkleIcon,
            title: 'Curated Excellence',
            description: 'A handpicked portfolio of premium accommodations that meet our rigorous aesthetic and service standards.',
        },
        {
            icon: CheckCircleIcon,
            title: 'Seamless Experience',
            description: 'From discovery to departure, every interaction is designed to be effortless and elegant.',
        },
    ];

    const team = [
        {
            name: 'Group 7',
            role: 'Founding Members',
            description: 'Passionate architects of digital experiences, dedicated to redefining luxury travel.',
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920"
                        alt="About Us Hero"
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center justify-center text-center">
                    <div className="max-w-3xl text-white">
                        <div className="mb-6 inline-flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-white/60"></span>
                            <span className="text-xs uppercase tracking-[0.2em] font-medium text-white/90">Established 2024</span>
                            <span className="w-8 h-[1px] bg-white/60"></span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
                            The Art of Living <br /> Well
                        </h1>
                        <p className="text-lg md:text-xl font-light text-white/80 leading-relaxed max-w-2xl mx-auto tracking-wide">
                            Your trusted curator for discovering and booking exceptional stays across Vietnam.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision - Editorial Style */}
            <section className="py-32 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
                        <div>
                            <HeartIcon size={32} weight="light" className="text-gray-900 mb-8" />
                            <h2 className="text-3xl font-serif text-gray-900 mb-6">
                                Our Mission
                            </h2>
                            <p className="text-gray-500 font-light leading-loose">
                                To revolutionize the hotel booking experience in Vietnam by providing a seamless, 
                                trustworthy platform that connects discerning travelers with exceptional accommodations. 
                                We strive to make every journey memorable through personalized service and innovative design.
                            </p>
                        </div>
                        <div>
                            <SparkleIcon size={32} weight="light" className="text-gray-900 mb-8" />
                            <h2 className="text-3xl font-serif text-gray-900 mb-6">
                                Our Vision
                            </h2>
                            <p className="text-gray-500 font-light leading-loose">
                                To become Vietnam's most beloved luxury booking platform, recognized for curation, 
                                elegance, and guest satisfaction. We envision a future where finding the perfect 
                                retreat is as inspiring as the stay itself.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-32 px-4 bg-gray-50">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl font-serif text-gray-900 mb-12">
                        The Story Begins
                    </h2>
                    <div className="space-y-8 text-gray-500 font-light leading-loose text-left md:text-center">
                        <p>
                            Founded in 2026, our platform was born from a simple observation: booking premium hotels 
                            in Vietnam should be a refined experience, free from clutter and confusion. What started as 
                            a passion project by Group 7 has evolved into a dedicated curation of luxury stays.
                        </p>
                        <p>
                            We understood the friction travelers face—overwhelming options, lack of aesthetic focus, 
                            and impersonal interfaces. We set out to craft a digital space that mirrors the serenity 
                            and elegance of the properties we represent.
                        </p>
                        <p>
                            Today, we partner with an exclusive collection of hotels across Vietnam's most desirable destinations. 
                            From the historic charm of Hanoi to the coastal tranquility of Nha Trang, our commitment remains singular: 
                            to elevate your journey from the very first click.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-32 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20">
                        <h2 className="text-4xl font-serif text-gray-900 mb-4">
                            Our Principles
                        </h2>
                        <p className="text-sm uppercase tracking-widest text-gray-500 font-light">
                            The foundation of our service
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="flex flex-col">
                                <div className="mb-8">
                                    <value.icon
                                        size={40}
                                        weight="light"
                                        className="text-gray-900"
                                    />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-4">
                                    {value.title}
                                </h3>
                                <p className="text-gray-500 font-light leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-32 px-4 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="mb-16">
                        <h2 className="text-4xl font-serif text-gray-900 mb-4">
                            The Curators
                        </h2>
                        <p className="text-sm uppercase tracking-widest text-gray-500 font-light">
                            Meet the minds behind the platform
                        </p>
                    </div>
                    
                    <div className="flex justify-center">
                        {team.map((member, index) => (
                            <div key={index} className="max-w-sm flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full mb-8 flex items-center justify-center bg-white border border-gray-200">
                                    <UsersThreeIcon size={40} weight="light" className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-2">
                                    {member.name}
                                </h3>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-6 font-medium">
                                    {member.role}
                                </p>
                                <p className="text-gray-500 font-light leading-relaxed text-center">
                                    {member.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-4 bg-white border-t border-gray-200 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-8">
                        Begin Your Journey
                    </h2>
                    <p className="text-gray-500 font-light mb-12 max-w-xl mx-auto leading-relaxed">
                        Join an exclusive circle of travelers who trust us to curate their most memorable stays.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link
                            to="/location"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-black text-white text-sm tracking-widest uppercase transition-colors rounded-sm w-full sm:w-auto justify-center"
                        >
                            Explore Portfolio
                            <ArrowRightIcon size={16} weight="light" />
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-sm tracking-widest uppercase transition-colors rounded-sm w-full sm:w-auto justify-center"
                        >
                            Contact Concierge
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;