'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const TEXTS = {
    en: {
        title: 'Send a Message',
        intro: 'Fill out the form and our team will get back to you shortly.',
        name: 'Full Name',
        phone: 'Phone',
        email: 'Email',
        company: 'Company (optional)',
        subject: 'Subject (optional)',
        message: 'Message',
        submit: 'Send Message',
        success: 'Thanks! We have received your message.',
        error: 'Something went wrong. Please try again.',
    },
    ar: {
        title: 'أرسل رسالة',
        intro: 'املأ النموذج وسيتواصل معك فريقنا قريبًا.',
        name: 'الاسم الكامل',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        company: 'الشركة (اختياري)',
        subject: 'الموضوع (اختياري)',
        message: 'الرسالة',
        submit: 'إرسال',
        success: 'شكرًا! تم استلام رسالتك.',
        error: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    },
    zh: {
        title: '发送留言',
        intro: '填写表单，我们将尽快与您联系。',
        name: '姓名',
        phone: '电话',
        email: '邮箱',
        company: '公司（可选）',
        subject: '主题（可选）',
        message: '留言内容',
        submit: '发送',
        success: '感谢！我们已收到您的信息。',
        error: '出错了，请稍后再试。',
    },
} as const;

type FormState = {
    name: string;
    phone: string;
    email: string;
    company?: string;
    subject?: string;
    message: string;
};

export default function ContactForm() {
    const { locale, dir } = useLanguage();
    const t = TEXTS[locale];

    const [form, setForm] = useState<FormState>({
        name: '',
        phone: '',
        email: '',
        company: '',
        subject: '',
        message: '',
    });
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((s) => ({ ...s, [k]: e.target.value }));

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || (!form.phone && !form.email) || !form.message) {
            setStatus('error');
            return;
        }
        try {
            setStatus('sending');

            // TODO: Wire to your backend endpoint, e.g.:
            // await api.post('/api/public/contact', { ...form, locale });
            await new Promise((r) => setTimeout(r, 700)); // demo

            setStatus('success');
            setForm({ name: '', phone: '', email: '', company: '', subject: '', message: '' });
        } catch {
            setStatus('error');
        }
    };

    return (
        <section className="py-14 md:py-20 bg-[var(--color-bg-alt)]" dir={dir}>
            <div className="max-w-3xl mx-auto px-6">
                <Card className="p-6 md:p-8">
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">{t.title}</h2>
                    <p className="mt-2 text-sm text-[var(--color-text-light)]">{t.intro}</p>

                    <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="name">{t.name}</Label>
                            <Input id="name" value={form.name} onChange={update('name')} required />
                        </div>

                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="company">{t.company}</Label>
                            <Input id="company" value={form.company} onChange={update('company')} />
                        </div>

                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="phone">{t.phone}</Label>
                            <Input id="phone" value={form.phone} onChange={update('phone')} />
                        </div>

                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="email">{t.email}</Label>
                            <Input id="email" type="email" value={form.email} onChange={update('email')} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="subject">{t.subject}</Label>
                            <Input id="subject" value={form.subject} onChange={update('subject')} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="message">{t.message}</Label>
                            <Textarea id="message" value={form.message} onChange={update('message')} rows={6} required />
                        </div>

                        <div className="md:col-span-2">
                            <Button
                                type="submit"
                                disabled={status === 'sending'}
                                className="bg-[var(--color-primary)] text-white opacity-90 hover:opacity-100 transition-opacity duration-300"
                            >
                                {status === 'sending' ? '...' : t.submit}
                            </Button>

                            {status === 'success' && (
                                <span className="ml-3 text-sm text-green-600">{t.success}</span>
                            )}
                            {status === 'error' && (
                                <span className="ml-3 text-sm text-red-600">{t.error}</span>
                            )}
                        </div>
                    </form>
                </Card>
            </div>
        </section>
    );
}
