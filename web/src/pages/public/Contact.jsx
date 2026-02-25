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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            setSubmitting(true);

            await axiosClient.post("/contacts", formData);

            toast.success("Your message has been sent successfully! We'll get back to you soon.");

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
        <div className="min-h-screen bg-base-200">
            {/* Hero Section */}
            <div
                className="relative h-64 bg-cover bg-center flex items-center justify-center"
                style={{
                    backgroundImage: `url('https://metaeventtravel.vn/wp-content/uploads/2022/10/40-hoat-dong-giai-tri-tot-nhat-o-Maldives.png')`,
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <h1 className="relative text-white text-5xl font-bold">Contact</h1>
            </div>

            {/* Contact Content */}
            <div className="container mx-auto px-4 py-16 max-w-5xl">

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body p-8 md:p-12">
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Contact Information */}
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Contact information</h2>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-semibold text-base-content mb-1">Address:</p>
                                        <p className="text-base-content/70">FPT University - Hà Nội</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-base-content mb-1">Email:</p>
                                        <p className="text-base-content/70">roomerangcorp@gmail.com</p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-base-content mb-1">Phone:</p>
                                        <p className="text-base-content/70">0123456789</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Name */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Name:</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Enter your full name"
                                            className="input input-bordered w-full"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Email:</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="your.email@example.com"
                                            className="input input-bordered w-full"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    {/* Message */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Message:</span>
                                        </label>
                                        <textarea
                                            name="message"
                                            placeholder="Please provide details about your inquiry, feedback, or issue..."
                                            className="textarea textarea-bordered h-32 resize-none w-full"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required
                                        ></textarea>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full md:w-auto px-8"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Sending...
                                            </>
                                        ) : (
                                            "SEND"
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
