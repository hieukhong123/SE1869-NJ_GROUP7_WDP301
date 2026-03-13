import { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import axiosClient from '../../services/axiosClient';
import { toast } from 'sonner';
import { CircleNotch, Envelope, PaperPlaneTilt, X, ChatCircleText } from '@phosphor-icons/react';

const statusConfig = {
    unread: { label: 'Unread', className: 'text-orange-800 bg-orange-50 border-orange-200' },
    read: { label: 'Read', className: 'text-gray-500 bg-gray-50 border-gray-200' },
    replied: { label: 'Replied', className: 'text-green-700 bg-green-50 border-green-200' },
};

const ContactList = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyModal, setReplyModal] = useState({ isOpen: false, contact: null });
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/contacts');
            setContacts(response.data || []);
        } catch {
            toast.error('Failed to load contact messages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const openReplyModal = async (contact) => {
        setReplyModal({ isOpen: true, contact });
        setReplyText('');
        // Mark as read if still unread
        if (contact.status === 'unread') {
            try {
                const updated = await axiosClient.patch(`/contacts/${contact._id}/read`);
                setContacts((prev) =>
                    prev.map((c) => (c._id === contact._id ? (updated.data || { ...c, status: 'read' }) : c))
                );
            } catch {
                // non-blocking
            }
        }
    };

    const closeReplyModal = () => {
        setReplyModal({ isOpen: false, contact: null });
        setReplyText('');
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) {
            toast.error('Please enter a reply message');
            return;
        }
        try {
            setSubmitting(true);
            const response = await axiosClient.post(`/contacts/${replyModal.contact._id}/reply`, { reply: replyText });
            setContacts((prev) =>
                prev.map((c) => (c._id === replyModal.contact._id ? (response.data || { ...c, status: 'replied', adminReply: replyText }) : c))
            );
            toast.success('Reply sent successfully');
            closeReplyModal();
        } catch (err) {
            toast.error(err?.message || 'Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    const columns = [
        {
            accessorKey: 'name',
            header: 'Sender',
            cell: (info) => (
                <div>
                    <p className="font-medium text-gray-900 text-sm">{info.getValue()}</p>
                    <p className="text-xs text-gray-400 font-light">{info.row.original.email}</p>
                </div>
            ),
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: (info) => (
                <span className="text-gray-500 font-light text-sm line-clamp-2 min-w-[280px] leading-relaxed block">
                    {info.getValue()}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: (info) => {
                const cfg = statusConfig[info.getValue()] || statusConfig.unread;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-widest font-medium border rounded-sm ${cfg.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${info.getValue() === 'replied' ? 'bg-green-500' : info.getValue() === 'read' ? 'bg-gray-400' : 'bg-orange-500'}`}></span>
                        {cfg.label}
                    </span>
                );
            },
        },
        {
            accessorKey: 'adminReply',
            header: 'Admin Reply',
            cell: (info) => (
                <span className="text-gray-400 font-light text-xs italic line-clamp-2 min-w-[200px] block">
                    {info.getValue() ? `"${info.getValue()}"` : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Received',
            cell: (info) => (
                <span className="text-xs text-gray-400 font-light whitespace-nowrap">{formatDate(info.getValue())}</span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (info) => (
                <button
                    onClick={() => openReplyModal(info.row.original)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border border-gray-300 text-gray-600 hover:border-orange-800 hover:text-orange-800 transition-colors rounded-sm"
                >
                    <PaperPlaneTilt size={13} weight="light" />
                    <span>{info.row.original.status === 'replied' ? 'View / Resend' : 'Reply'}</span>
                </button>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <CircleNotch size={28} weight="light" className="text-orange-800 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8 lg:p-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800">
                        Guest Relations
                    </span>
                </div>
                <h1 className="text-3xl font-serif text-gray-900">Contact Messages</h1>
                <p className="text-gray-400 font-light text-sm mt-2">
                    <span>{contacts.length}</span> total messages &middot; <span>{contacts.filter((c) => c.status === 'unread').length}</span> unread
                </p>
            </div>

            {contacts.length === 0 ? (
                <div className="text-center py-32 border border-gray-100 rounded-sm bg-white shadow-sm">
                    <Envelope size={48} weight="light" className="mx-auto text-gray-300 mb-6" />
                    <h2 className="text-2xl font-serif text-gray-900 mb-2">No messages yet</h2>
                    <p className="text-gray-400 font-light text-sm">Contact submissions will appear here.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <Table data={contacts} columns={columns} />
                </div>
            )}

            {/* Reply Modal */}
            {replyModal.isOpen && replyModal.contact && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full sm:w-[540px] rounded-t-2xl sm:rounded-sm flex flex-col overflow-hidden shadow-2xl">

                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h3 className="font-serif text-2xl text-gray-900">Reply to Message</h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-orange-800 mt-1">
                                    {replyModal.contact.name} &mdash; {replyModal.contact.email}
                                </p>
                            </div>
                            <button onClick={closeReplyModal} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={20} weight="light" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                            {/* Original message */}
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Original Message</p>
                                <div className="bg-gray-50 border border-gray-100 rounded-sm p-4 text-sm text-gray-600 font-light leading-relaxed whitespace-pre-wrap">
                                    {replyModal.contact.message}
                                </div>
                            </div>

                            {/* Previous reply (if any) */}
                            {replyModal.contact.adminReply && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Previous Reply</p>
                                    <div className="bg-orange-50 border border-orange-100 rounded-sm p-4 text-sm text-gray-700 font-light leading-relaxed whitespace-pre-wrap">
                                        {replyModal.contact.adminReply}
                                    </div>
                                </div>
                            )}

                            {/* Reply form */}
                            <form onSubmit={handleReplySubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                        Your Reply
                                    </label>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        rows={5}
                                        placeholder="Write your reply here..."
                                        className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-2 text-gray-900 font-light placeholder-gray-300 focus:ring-0 focus:border-orange-800 transition-colors resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={closeReplyModal}
                                        className="flex-1 py-3 bg-transparent border border-gray-300 hover:border-gray-900 text-gray-900 text-xs tracking-widest uppercase transition-colors rounded-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-gray-900 hover:bg-black text-white text-xs tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {submitting ? (
                                            <><CircleNotch size={14} className="animate-spin" /><span>Sending...</span></>
                                        ) : (
                                            <><PaperPlaneTilt size={14} weight="light" /><span>Send Reply</span></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactList;
