import { useState } from "react";
import { toast } from "sonner";
import axiosClient from "../../services/axiosClient";

const Contact = () => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.message) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email.trim())) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Name validation: no numbers
        if (!/^[a-zA-Z\s\u00C0-\u1EF9]+$/.test(formData.name.trim())) {
            toast.error("Full name should only contain letters");
            return;
        }

        try {
            setSubmitting(true);

            await axiosClient.post("/contacts", formData);

            toast.success("Your message has been sent successfully. Our concierge will be in touch shortly.");

            // Reset form
            setFormData({
                name: "",
                email: "",
                message: "",
            });
        } catch (err) {
            console.error("Error submitting contact form:", err);
            toast.error(err.response?.data?.message || "Failed to send message. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
                    style={{
                        backgroundImage: `url('https://metaeventtravel.vn/wp-content/uploads/2022/10/40-hoat-dong-giai-tri-tot-nhat-o-Maldives.png')`,
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
                <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
                    <span className="text-white/80 text-xs uppercase tracking-[0.2em] font-medium mb-4">
                        At Your Service
                    </span>
                    <h1 className="text-white text-5xl md:text-6xl font-serif">Contact Concierge</h1>
                </div>
            </div>

            {/* Contact Content */}
            <section className="py-24 md:py-32 px-4 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
                    
                    {/* Contact Information */}
                    <div className="flex flex-col justify-center">
                        <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-6">
                            How can we assist you?
                        </h2>
                        <p className="text-gray-500 font-light leading-relaxed mb-12 max-w-md">
                            Whether you are planning a future stay, have questions about our curated properties, or require personalized assistance, our dedicated team is at your disposal.
                        </p>
                        
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                    Headquarters
                                </h3>
                                <p className="text-gray-900 font-light text-lg">
                                    FPT University<br />
                                    Hanoi, Vietnam
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                    Direct Inquiries
                                </h3>
                                <a 
                                    href="mailto:roomerangcorp@gmail.com" 
                                    className="block text-gray-900 font-light text-lg hover:text-gray-500 transition-colors"
                                >
                                    roomerangcorp@gmail.com
                                </a>
                                <a 
                                    href="tel:0123456789" 
                                    className="block text-gray-900 font-light text-lg hover:text-gray-500 transition-colors mt-1"
                                >
                                    +84 123 456 789
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-gray-50 p-8 md:p-12 lg:p-16 rounded-sm border border-gray-100">
                        <h2 className="text-2xl font-serif text-gray-900 mb-8">
                            Send a Message
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Name */}
                            <div className="relative">
                                <label htmlFor="name" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Message */}
                            <div className="relative">
                                <label htmlFor="message" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                                    Your Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light focus:ring-0 focus:border-gray-900 transition-colors placeholder-gray-300 resize-none h-24"
                                    placeholder="Your Message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 px-8 bg-gray-900 hover:bg-black text-white text-sm uppercase tracking-widest transition-all duration-300 rounded-sm mt-4 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Sending...
                                    </>
                                ) : (
                                    "Send Inquiry"
                                )}
                            </button>
                        </form>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default Contact;