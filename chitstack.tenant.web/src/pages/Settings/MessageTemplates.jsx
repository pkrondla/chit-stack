import { useState, useEffect, useRef, useMemo } from 'react';
import { Typography, Button, Space, message, Spin, Select, Badge, Input, Form, Switch, InputNumber, Card } from 'antd';
import { MessageSquare, Smartphone, Mail, Zap, LayoutList, Save, ArrowLeft, Settings2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { semanticColors } from '../../theme/tokens';

import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const { Title, Text, Paragraph } = Typography;

// Tracks which DOM nodes already have a Quill instance attached.
// Survives React Strict Mode's double-invoke because the WeakMap key is the actual DOM node.
const quillInstances = new WeakMap();

const QuillEditor = ({ value, onChange, placeholder, modules, formats }) => {
    const editorRef = useRef(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    useEffect(() => {
        const el = editorRef.current;
        if (!el || quillInstances.has(el)) return;

        // Set a minimum height on the editor element itself
        el.style.minHeight = '300px';

        const quill = new Quill(el, {
            theme: 'snow',
            placeholder: placeholder || 'Start designing...',
            modules,
            formats,
        });

        quillInstances.set(el, quill);

        if (value) {
            quill.clipboard.dangerouslyPasteHTML(value);
        }

        quill.on('text-change', () => {
            const html = quill.root.innerHTML;
            onChangeRef.current(html === '<p><br></p>' ? '' : html);
        });

        return () => {
            quillInstances.delete(el);
            // Remove the Quill-generated toolbar sibling and clear the editor element
            const toolbar = el.previousElementSibling;
            if (toolbar && toolbar.classList.contains('ql-toolbar')) {
                toolbar.remove();
            }
            el.innerHTML = '';
            el.className = '';
        };
    }, []); // key prop on the parent drives remount when template changes

    return (
        <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
            <div ref={editorRef} />
        </div>
    );
};

const MessageTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    // Quill Toolbar Configuration
    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'clean'],
            ['code-block']
        ],
    }), []);

    const quillFormats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'indent', 'link', 'color', 'background', 'code-block'
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/adminnotification/templates');
            setTemplates(res.data);
            if (res.data.length > 0) {
                setSelectedTemplateId(res.data[0].id);
            }
        } catch (err) {
            message.error('Failed to load designer data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveTemplate = async (currentTemplate) => {
        try {
            setSaving(true);
            await api.put(`/adminnotification/templates/${currentTemplate.id}`, currentTemplate);
            message.success(`${currentTemplate.name} updated!`);
        } catch (err) {
            message.error('Failed to update template');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12 h-[60vh] items-center"><Spin size="large" description="Loading Designer..." /></div>;

    const currentTemplate = templates.find(t => t.id === selectedTemplateId);

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <Button 
                        icon={<ArrowLeft size={18} />} 
                        className="rounded-xl border-slate-200 h-12 w-12 flex items-center justify-center"
                        onClick={() => navigate(-1)}
                    />
                    <div>
                        <Title level={2} className="!m-0 text-slate-800">Message Designer</Title>
                        <Text className="text-slate-500 text-sm">Craft personalized alerts for all communication channels.</Text>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Select
                        showSearch
                        className="w-full lg:w-72"
                        size="large"
                        placeholder="Select Notification Type"
                        optionFilterProp="children"
                        value={selectedTemplateId}
                        onChange={setSelectedTemplateId}
                        suffixIcon={<LayoutList size={18} className="text-slate-400" />}
                        style={{ height: '48px' }}
                    >
                        {templates.map(tmp => {
                            const isBackground = tmp.name.includes('Reminders') || tmp.name.includes('Alerts');
                            return (
                                <Select.Option key={tmp.id} value={tmp.id}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isBackground ? (
                                                <Clock size={14} className="text-amber-500" />
                                            ) : (
                                                <Zap size={14} className="text-indigo-500" />
                                            )}
                                            <span className="font-semibold text-sm text-slate-700">{tmp.name}</span>
                                        </div>
                                        <div className="flex gap-1 ml-4 opacity-40">
                                            {tmp.whatsAppTemplate && <MessageSquare size={10} />}
                                            {tmp.smsTemplate && <Smartphone size={10} />}
                                            {tmp.emailHtmlTemplate && <Mail size={10} />}
                                        </div>
                                    </div>
                                </Select.Option>
                            );
                        })}
                    </Select>
                    
                    {currentTemplate && (
                        <Button 
                            type="primary" 
                            size="large" 
                            loading={saving}
                            icon={<Save size={18} />}
                            className="rounded-xl bg-indigo-600 h-12 px-8 font-bold shadow-lg shadow-indigo-100 border-0" 
                            onClick={() => handleSaveTemplate(currentTemplate)}
                        >
                            Save Design
                        </Button>
                    )}
                </div>
            </div>

            {/* Editing Area */}
            {currentTemplate ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    {/* Variable Guide */}
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                                <Zap size={22} />
                            </div>
                            <div>
                                <Text strong className="text-[10px] uppercase font-black tracking-widest text-orange-900 block mb-1">Available Placeholders</Text>
                                <Text className="text-sm text-orange-700 font-mono font-bold uppercase tracking-tight">
                                    {currentTemplate.placeholders}
                                </Text>
                            </div>
                        </div>
                        <Badge count="LIVE EDITOR" style={{ backgroundColor: semanticColors.amber, borderRadius: '8px', fontWeight: '900', padding: '0 12px' }} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Primary Content Editor */}
                        <div className="lg:col-span-12">
                            <Card 
                                className="shadow-sm border-0 rounded-3xl overflow-hidden bg-white border border-slate-100"
                                styles={{ body: { padding: '2rem' } }}
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                        <LayoutList size={22} />
                                    </div>
                                    <Title level={4} className="!m-0 text-slate-800">Primary Message Identity</Title>
                                </div>
                                
                                <Form layout="vertical">
                                    <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notification Heading (Portal / Dashboard)</span>}>
                                        <Input 
                                            placeholder="Enter alert title..." 
                                            value={currentTemplate.titleTemplate} 
                                            onChange={e => {
                                                const newTemplates = [...templates];
                                                const t = newTemplates.find(t => t.id === currentTemplate.id);
                                                if (t) t.titleTemplate = e.target.value;
                                                setTemplates(newTemplates);
                                            }}
                                            className="rounded-xl h-12 border-slate-200 text-base font-bold bg-slate-50 shadow-inner px-4 focus:bg-white transition-all"
                                        />
                                    </Form.Item>
                                    <Form.Item label={<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detail Summary (Fallback for all channels)</span>}>
                                        <Input.TextArea 
                                            rows={4} 
                                            placeholder="The main fallback message content goes here..." 
                                            value={currentTemplate.messageTemplate} 
                                            onChange={e => {
                                                const newTemplates = [...templates];
                                                const t = newTemplates.find(t => t.id === currentTemplate.id);
                                                if (t) t.messageTemplate = e.target.value;
                                                setTemplates(newTemplates);
                                            }}
                                            className="rounded-2xl border-slate-200 bg-slate-50 p-4 focus:bg-white transition-all"
                                        />
                                    </Form.Item>
                                </Form>
                            </Card>
                        </div>

                        {/* WhatsApp Override */}
                        <div className="lg:col-span-6">
                            <Card 
                                className="shadow-sm border-0 rounded-3xl overflow-hidden bg-white border border-slate-100 h-full"
                                styles={{ body: { padding: '2rem', backgroundColor: semanticColors.mintBg } }}
                            >
                                <div className="flex items-center gap-3 text-green-700 mb-6 font-black uppercase tracking-widest text-xs">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><MessageSquare size={16} /></div>
                                    WhatsApp Integration
                                </div>
                                <Input.TextArea 
                                    rows={8} 
                                    placeholder="Add *bold* or _italic_ formatting..." 
                                    value={currentTemplate.whatsAppTemplate} 
                                    onChange={e => {
                                        const newTemplates = [...templates];
                                        const t = newTemplates.find(t => t.id === currentTemplate.id);
                                        if (t) t.whatsAppTemplate = e.target.value;
                                        setTemplates(newTemplates);
                                    }}
                                    className="rounded-2xl border-green-200/50 bg-white p-5 text-sm leading-relaxed shadow-sm h-full"
                                />
                                <Text className="text-[10px] text-green-700/60 font-bold block mt-4 uppercase">AUTO-FALLBACK ENABLED IF EMPTY</Text>
                            </Card>
                        </div>

                        {/* SMS Override */}
                        <div className="lg:col-span-6">
                            <Card 
                                className="shadow-sm border-0 rounded-3xl overflow-hidden bg-white border border-slate-100 h-full"
                                styles={{ body: { padding: '2rem', backgroundColor: semanticColors.lilacBg } }}
                            >
                                <div className="flex items-center gap-3 text-purple-700 mb-6 font-black uppercase tracking-widest text-xs">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><Smartphone size={16} /></div>
                                    Short Message (SMS)
                                </div>
                                <Input.TextArea 
                                    rows={8} 
                                    maxLength={160}
                                    placeholder="Brief text alert for mobile carriers..." 
                                    value={currentTemplate.smsTemplate} 
                                    onChange={e => {
                                        const newTemplates = [...templates];
                                        const t = newTemplates.find(t => t.id === currentTemplate.id);
                                        if (t) t.smsTemplate = e.target.value;
                                        setTemplates(newTemplates);
                                    }}
                                    className="rounded-2xl border-purple-200/50 bg-white p-5 text-sm font-mono shadow-sm"
                                />
                                <div className="flex justify-between items-center mt-5">
                                    <Text className="text-[10px] text-purple-500 font-black uppercase tracking-wider">SMS Payload Size</Text>
                                    <Badge 
                                        count={`${160 - (currentTemplate.smsTemplate?.length || 0)} CHARS`} 
                                        style={{ backgroundColor: semanticColors.violet, borderRadius: '4px', fontSize: '9px', fontWeight: '900' }} 
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Email HTML Override */}
                        <div className="lg:col-span-12">
                            <Card 
                                className="shadow-sm border-0 rounded-3xl overflow-hidden bg-white border border-slate-100"
                                styles={{ body: { padding: '2.5rem', backgroundColor: semanticColors.peachBg } }}
                            >
                                <div className="flex items-center gap-3 text-orange-700 mb-6 font-black uppercase tracking-widest text-xs">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><Mail size={20} /></div>
                                    Email Logic (Rich Text & Visual Designer)
                                </div>
                                <QuillEditor 
                                    key={currentTemplate.id}
                                    value={currentTemplate.emailHtmlTemplate || ''}
                                    onChange={content => {
                                        const newTemplates = [...templates];
                                        const t = newTemplates.find(tr => tr.id === currentTemplate.id);
                                        if (t) t.emailHtmlTemplate = content;
                                        setTemplates(newTemplates);
                                    }}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Start designing your rich email body here..."
                                />
                                <div className="mt-6 flex flex-wrap gap-4 items-center justify-between p-4 bg-white/60 rounded-2xl border border-orange-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Settings2 size={16} />
                                        </div>
                                        <Text className="text-[11px] text-orange-800 font-medium">
                                            <strong>HTML ENGINE ENABLED:</strong> Designing responsive, high-impact alerts for member inboxes.
                                        </Text>
                                    </div>
                                    <Badge 
                                        status="processing" 
                                        color={semanticColors.warning} 
                                        text={<span className="text-[10px] font-black text-orange-900 uppercase">Visual Editor Live</span>} 
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-32 bg-slate-50/50 rounded-3xl border-4 border-dashed border-slate-100 mx-auto max-w-4xl">
                    <div className="w-24 h-24 rounded-full bg-slate-100/50 flex items-center justify-center mb-8 animate-pulse">
                        <Zap size={48} className="text-slate-200" />
                    </div>
                    <Text className="font-black text-slate-300 text-lg uppercase tracking-widest">Select a Template to Begin Designing</Text>
                    <Text className="text-slate-400 text-sm mt-2">Pick a notification type from the dropdown above</Text>
                </div>
            )}
        </div>
    );
};

export default MessageTemplates;
