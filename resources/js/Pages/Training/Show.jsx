import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { 
    FaChalkboardTeacher, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaArrowLeft, FaEdit, 
    FaFileDownload, FaTrash, FaCheckCircle, FaLock, FaStar, FaMedal, FaTimesCircle, FaClipboardList, 
    FaPlusCircle, FaMinusCircle, FaShieldAlt, FaInfoCircle, FaGraduationCap, FaClock, FaChevronRight, FaChevronDown
} from 'react-icons/fa';
import Avatar from '@/Components/Avatar';

export default function Show({ training, userRole = 'employee', userProgress, settings, quizAttempt }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [confirmingQuizDelete, setConfirmingQuizDelete] = useState(false);
    const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

    // Forms
    const materialForm = useForm({
        title: '',
        description: '',
        file: null,
        is_mandatory: false,
    });

    const quizForm = useForm({
        title: 'Final Assessment',
        passing_score: 70,
        time_limit_minutes: 30,
        questions: [
            { question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '0', points: 1 }
        ]
    });

    const quizSubmissionForm = useForm({
        answers: {} // question_id: answer
    });

    const evaluationForm = useForm({
        rating: 5,
        content_quality: 5,
        trainer_effectiveness: 5,
        relevance: 5,
        would_recommend: true,
        feedback_text: '',
        suggestions: '',
    });

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        if (time.includes('T')) return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return time.substring(0, 5);
    };

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        hideCancel: false
    });

    const closeModal = () => setConfirmingAction(prev => ({ ...prev, show: false }));

    const handleMaterialUpload = (e) => {
        e.preventDefault();
        materialForm.post(route('training-materials.store', training.id), {
            onSuccess: () => {
                setShowMaterialModal(false);
                materialForm.reset();
            },
        });
    };

    const handleEvaluationSubmit = (e) => {
        e.preventDefault();
        if (!userProgress?.id) return;

        evaluationForm.post(route('training-evaluations.store', userProgress.id), {
            onSuccess: () => {
                setConfirmingAction({
                    show: true,
                    title: 'Evaluation Submitted',
                    message: 'Evaluation submitted successfully!',
                    type: 'success',
                    hideCancel: true,
                    onConfirm: closeModal
                });
                evaluationForm.reset();
            },
        });
    };

    const handleQuizCreate = (e) => {
        e.preventDefault();
        quizForm.post(route('training-quizzes.store', training.id), {
            onSuccess: () => {
                setShowQuizModal(false);
                quizForm.reset();
            },
        });
    };

    const handleQuizSubmit = (e) => {
        e.preventDefault();
        if (!training.quiz) return;

        quizSubmissionForm.post(route('training-quizzes.submit', training.quiz.id), {
            onSuccess: () => {
                setConfirmingAction({
                    show: true,
                    title: 'Quiz Submitted',
                    message: 'Quiz submitted successfully!',
                    type: 'success',
                    hideCancel: true,
                    onConfirm: closeModal
                });
            }
        });
    };

    const handleDeleteQuiz = () => {
        if (!training.quiz) return;
        setIsDeletingQuiz(true);
        router.delete(route('training-quizzes.destroy', training.quiz.id), {
            onFinish: () => {
                setIsDeletingQuiz(false);
                setConfirmingQuizDelete(false);
            }
        });
    };

    const addQuestion = () => {
        const newQuestions = [...quizForm.data.questions, { question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '0', points: 1 }];
        quizForm.setData('questions', newQuestions);
    };

    const removeQuestion = (index) => {
        const newQuestions = quizForm.data.questions.filter((_, i) => i !== index);
        quizForm.setData('questions', newQuestions);
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...quizForm.data.questions];
        newQuestions[index][field] = value;
        quizForm.setData('questions', newQuestions);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...quizForm.data.questions];
        newQuestions[qIndex].options[oIndex] = value;
        quizForm.setData('questions', newQuestions);
    };

    const generateCertificate = () => {
        if (!userProgress?.id) return;
        router.post(route('certificates.generate', userProgress.id));
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2.5 px-6 py-3.5 text-[9px] font-normal uppercase tracking-normal transition-all relative whitespace-nowrap ${activeTab === id
                ? 'text-primary bg-primary/5'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
        >
            <Icon size={10} />
            {label}
            {activeTab === id && <div className="absolute right-0 top-0 w-0.5 h-full bg-primary"></div>}
        </button>
    );

    return (
        <AuthenticatedLayout header={<h2 className="text-sm font-normal text-slate-900 uppercase">Training Details</h2>}>
            <Head title={`Training - ${training.title}`} />

            <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
                {/* Executive Control Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <Link 
                            href={route('trainings.index')} 
                            className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-all active:scale-95 border border-slate-100"
                        >
                            <FaArrowLeft size={10} />
                        </Link>
                        <div>
                            <h2 className="text-lg font-normal text-slate-900 tracking-normal leading-none mb-1 uppercase">Training Details</h2>
                            <p className="text-[10px] font-normal text-slate-400 uppercase flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
                                REF: TRN-{training.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto">
                        {(userRole === 'admin' || userRole === 'hr' || userRole === 'manager') && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Link
                                    href={route('trainings.edit', training.id)}
                                    className="flex-1 sm:flex-none px-4 py-1.5 bg-slate-900 text-white rounded text-[10px] font-normal uppercase hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaEdit size={10} />
                                    Edit
                                </Link>
                                <Link
                                    href={route('training-assignments.index', { training_id: training.id })}
                                    className="flex-1 sm:flex-none px-4 py-1.5 bg-white border border-slate-200 text-slate-900 rounded text-[10px] font-normal uppercase hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaUsers size={10} />
                                    Employees
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Module Visual Identity */}
                <div className="bg-slate-900 rounded-lg p-5 text-white shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 text-primary opacity-5">
                        <FaGraduationCap size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="max-w-2xl space-y-3">
                            <span className="px-2 py-0.5 bg-white/10 text-white rounded text-[8px] font-normal uppercase border border-white/10">
                                {training.category?.toUpperCase() || 'GENERAL'}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-normal tracking-normal leading-none uppercase">
                                {training.title}
                            </h1>
                            <div className="flex flex-wrap gap-5">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-normal text-white uppercase">Trainer</p>
                                    <p className="text-[11px] font-normal text-white uppercase flex items-center gap-1.5">
                                        <FaChalkboardTeacher size={10} className="text-white" />
                                        {training.trainer_name || 'NULL'}
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-normal text-white uppercase">Location</p>
                                    <p className="text-[11px] font-normal text-white uppercase flex items-center gap-1.5">
                                        <FaMapMarkerAlt size={10} className="text-white" />
                                        {training.location || 'Online / Virtual'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {userRole === 'employee' && userProgress && (
                            <div className="w-full md:w-56 space-y-3">
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-[9px] font-normal text-white uppercase">My Progress</p>
                                        <p className="text-xl font-normal text-primary tracking-normal">{userProgress.progress_percentage}%</p>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                            style={{ width: `${userProgress.progress_percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[8px] font-normal text-white/60 uppercase mt-2 flex items-center gap-1.5">
                                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                        STATUS: {userProgress.status?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Functional Interface Grid */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                    {/* Navigation Sidebar */}
                    <div className="w-full md:w-56 bg-slate-50/50 border-r border-slate-100 flex flex-col py-2">
                        <TabButton id="overview" label="Overview" icon={FaInfoCircle} />
                        <TabButton id="sessions" label="Sessions" icon={FaCalendarAlt} />
                        <TabButton id="materials" label="Materials" icon={FaFileDownload} />
                        <TabButton id="assessment" label="Assessment" icon={FaClipboardList} />
                        <TabButton id="certificate" label="Certificate" icon={FaMedal} />
                        <TabButton id="evaluation" label="Feedback" icon={FaStar} />
                    </div>

                    {/* Content Viewport */}
                    <div className="flex-1 p-6 relative">
                        {/* Overview Section */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><FaInfoCircle size={12}/></div>
                                            About Training
                                        </h3>
                                        <p className="text-base font-normal text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {training.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                        <h4 className="text-[10px] font-normal text-slate-400 uppercase mb-2">Summary</h4>
                                        
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Start Date', value: formatDate(training.start_date), icon: FaCalendarAlt },
                                                { label: 'End Date', value: formatDate(training.end_date), icon: FaCalendarAlt },
                                                { label: 'Max Participants', value: training.max_participants || 'UNLIMITED', icon: FaUsers },
                                                { label: 'Passing Score', value: `${settings?.passing_score || 80}%`, icon: FaCheckCircle }
                                            ].map((fact, i) => (
                                                <div key={i} className="flex items-center gap-4 group/fact">
                                                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-primary group-hover/fact:border-primary/20 transition-colors">
                                                        <fact.icon size={12} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-normal text-slate-400 uppercase">{fact.label}</p>
                                                        <p className="text-[10px] font-normal text-slate-900 uppercase">{fact.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sessions Section */}
                        {activeTab === 'sessions' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><FaCalendarAlt size={12}/></div>
                                        Sessions
                                    </h3>
                                    <span className="px-4 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-normal uppercase">
                                        {training.sessions?.length || 0} SESSIONS
                                    </span>
                                </div>

                                {training.sessions && training.sessions.length > 0 ? (
                                    <div className="grid gap-4">
                                        {training.sessions.map((session) => (
                                            <div key={session.id} className="group bg-white border border-slate-100 p-4 rounded-lg hover:border-primary/20 hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 bg-slate-100 group-hover:bg-primary h-full transition-colors duration-500"></div>
                                                <div className="flex-shrink-0 w-16 h-16 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-900 border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500">
                                                    <span className="text-[9px] font-normal uppercase opacity-60">
                                                        {new Date(session.session_date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                                    </span>
                                                    <span className="text-2xl font-normal tracking-normal">
                                                        {new Date(session.session_date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 space-y-1 text-left">
                                                    <h4 className="text-lg font-normal text-slate-900 uppercase tracking-normal">Session #{session.id}</h4>
                                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-normal text-slate-400 uppercase">
                                                        <span className="flex items-center gap-2"><FaClock className="text-primary" size={12} /> {formatTime(session.start_time)} — {formatTime(session.end_time)}</span>
                                                        <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-primary" size={12} /> {session.location || training.location || 'VIRTUAL HUB'}</span>
                                                    </div>
                                                </div>
                                                <Link href={route('training-sessions.attendance', session.id)} className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-lg flex items-center justify-center transition-all group/btn active:scale-90">
                                                    <FaChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-12 rounded-lg text-center border-2 border-dashed border-slate-100">
                                        <p className="text-[10px] font-normal text-slate-400 uppercase">No sessions scheduled.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Materials Section */}
                        {activeTab === 'materials' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><FaFileDownload size={12}/></div>
                                        Materials
                                    </h3>
                                    {userRole !== 'employee' && (
                                        <button onClick={() => setShowMaterialModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase hover:bg-primary transition-all active:scale-95 flex items-center gap-2">
                                            <FaPlusCircle size={10} /> Upload
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {training.materials && training.materials.length > 0 ? (
                                        training.materials.map((material) => (
                                            <div key={material.id} className="group bg-white border border-slate-200 rounded-lg p-4 hover:border-primary/20 hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 relative flex flex-col">
                                                <div className="absolute top-4 right-4">
                                                    {material.is_mandatory && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-lg text-[8px] font-normal uppercase border border-rose-500/20">MANDATORY</span>}
                                                </div>
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                                    <FaFileDownload size={18} />
                                                </div>
                                                <h4 className="text-base font-normal text-slate-900 uppercase tracking-normal mb-1 truncate" title={material.title}>{material.title}</h4>
                                                <p className="text-[9px] font-normal text-slate-400 uppercase mb-4">{(material.file_size / 1024).toFixed(2)} KB • FILE</p>
                                                
                                                {material.description && (
                                                    <p className="text-[10px] font-normal text-slate-500 uppercase leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4">
                                                        {material.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 mt-auto">
                                                    <a href={route('training-materials.download', material.id)} className="flex-1 px-4 py-2 bg-slate-50 hover:bg-primary hover:text-white text-slate-900 text-[10px] font-normal uppercase rounded-lg transition-all text-center">
                                                        Download
                                                    </a>
                                                    {userRole !== 'employee' && (
                                                        <button onClick={() => router.delete(route('training-materials.destroy', material.id))} className="w-10 h-10 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-all active:scale-90">
                                                            <FaTrash size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full bg-slate-50 p-12 rounded-lg text-center border-2 border-dashed border-slate-100">
                                            <p className="text-[10px] font-normal text-slate-400 uppercase">No materials available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Assessment Section */}
                        {activeTab === 'assessment' && (
                            <div className="animate-fadeIn max-w-4xl mx-auto space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-normal text-slate-900 uppercase flex items-center gap-3">
                                        <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><FaClipboardList size={12}/></div>
                                        Assessment
                                    </h3>
                                    {(userRole !== 'employee' && !training.quiz) && (
                                        <button
                                            onClick={() => setShowQuizModal(true)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-normal uppercase hover:bg-primary transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <FaPlusCircle size={10} /> Create Quiz
                                        </button>
                                    )}
                                    {(userRole !== 'employee' && training.quiz) && (
                                        <button
                                            onClick={() => setConfirmingQuizDelete(true)}
                                            className="px-4 py-2 bg-white border border-rose-100 text-rose-600 rounded-lg text-[10px] font-normal uppercase hover:bg-rose-50 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <FaTrash size={10} /> Delete Quiz
                                        </button>
                                    )}
                                </div>

                                {training.quiz ? (
                                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="bg-slate-900 p-6 text-white relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 text-primary opacity-20 group-hover:scale-110 transition-transform">
                                                <FaClipboardList size={80} />
                                            </div>
                                            <h4 className="text-xl font-normal uppercase mb-4 relative z-10">{training.quiz.title}</h4>
                                            <div className="flex flex-wrap gap-6 relative z-10">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-normal text-white uppercase">Passing Score</p>
                                                    <p className="text-sm font-normal text-primary uppercase">{training.quiz.passing_score}%</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-normal text-white uppercase">Time Limit</p>
                                                    <p className="text-sm font-normal text-slate-100 uppercase">{training.quiz.time_limit_minutes || 'UNLIMITED'} MINS</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-normal text-white uppercase">Questions</p>
                                                    <p className="text-sm font-normal text-slate-100 uppercase">{training.quiz.questions?.length || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {userRole === 'employee' ? (
                                            <div className="p-6">
                                                {quizAttempt ? (
                                                    <div className={`text-center p-8 rounded-lg border-2 border-dashed ${quizAttempt.is_passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                                                        {quizAttempt.is_passed ? (
                                                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
                                                                <FaCheckCircle size={24} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 bg-rose-500 text-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-500/20">
                                                                <FaTimesCircle size={24} />
                                                            </div>
                                                        )}
                                                        <h3 className={`text-2xl font-normal uppercase tracking-normal mb-1 ${quizAttempt.is_passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {quizAttempt.is_passed ? 'PASSED' : 'FAILED'}
                                                        </h3>
                                                        <p className="text-4xl font-normal text-slate-900 tracking-normal mb-4">
                                                            {Math.round(quizAttempt.score_achieved)}%
                                                        </p>
                                                        <p className="text-[10px] font-normal text-slate-400 uppercase">
                                                            COMPLETED ON {new Date(quizAttempt.completed_at).toLocaleDateString().toUpperCase()}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handleQuizSubmit} className="space-y-6">
                                                        {training.quiz.questions?.map((q, idx) => (
                                                            <div key={q.id} className="p-6 bg-slate-50/50 rounded-lg border border-slate-100 space-y-4 group/query transition-all">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex gap-4">
                                                                        <span className="text-2xl font-normal text-primary/30 group-hover/query:text-primary transition-colors">{String(idx + 1).padStart(2, '0')}</span>
                                                                        <p className="text-lg font-normal text-slate-900 tracking-normal leading-tight uppercase">
                                                                            {q.question_text}
                                                                        </p>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 bg-white text-slate-400 rounded-lg text-[8px] font-normal uppercase border border-slate-100">
                                                                        {q.points} PTS
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                                                                    {q.question_type === 'true_false' ? (
                                                                        ['TRUE', 'FALSE'].map((opt) => (
                                                                            <label key={opt} className="relative cursor-pointer group/opt">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`q_${q.id}`}
                                                                                    value={opt.toLowerCase()}
                                                                                    checked={quizSubmissionForm.data.answers[q.id] === opt.toLowerCase()}
                                                                                    onChange={() => quizSubmissionForm.setData('answers', { ...quizSubmissionForm.data.answers, [q.id]: opt.toLowerCase() })}
                                                                                    className="peer hidden"
                                                                                />
                                                                                <div className="px-4 py-2 bg-white border border-slate-200 rounded-[3px] text-[10px] font-normal text-slate-500 uppercase tracking-normal peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all group-hover/opt:border-primary/20">
                                                                                    {opt}
                                                                                </div>
                                                                            </label>
                                                                        ))
                                                                    ) : (
                                                                        q.options?.map((opt, oIdx) => (
                                                                            <label key={oIdx} className="relative cursor-pointer group/opt">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`q_${q.id}`}
                                                                                    value={oIdx.toString()}
                                                                                    checked={quizSubmissionForm.data.answers[q.id] === oIdx.toString()}
                                                                                    onChange={() => quizSubmissionForm.setData('answers', { ...quizSubmissionForm.data.answers, [q.id]: oIdx.toString() })}
                                                                                    className="peer hidden"
                                                                                />
                                                                                <div className="px-4 py-2 bg-white border border-slate-200 rounded-[3px] text-[10px] font-normal text-slate-500 uppercase peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all group-hover/opt:border-primary/20">
                                                                                    {opt.toUpperCase()}
                                                                                </div>
                                                                            </label>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-center pt-4">
                                                            <button
                                                                type="submit"
                                                                disabled={quizSubmissionForm.processing}
                                                                className="px-8 py-3 bg-primary text-white rounded-lg text-[11px] font-normal uppercase shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                                                            >
                                                                Submit Quiz
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-6 space-y-4">
                                                {training.quiz.questions?.map((q, idx) => (
                                                    <div key={q.id} className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                                                        <div className="flex items-start gap-3 mb-4">
                                                            <span className="text-lg font-normal text-slate-300">{String(idx + 1).padStart(2, '0')}</span>
                                                            <p className="text-sm font-normal text-slate-900 uppercase">{q.question_text}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 pl-8">
                                                            {q.question_type === 'true_false' ? (
                                                                ['true', 'false'].map(val => (
                                                                    <div key={val} className={`px-3 py-1 rounded-lg text-[9px] font-normal uppercase border ${q.correct_answer === val ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                                        {val} {q.correct_answer === val && ' (CORRECT)'}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                q.options?.map((opt, oIdx) => (
                                                                    <div key={oIdx} className={`px-3 py-1 rounded-lg text-[9px] font-normal uppercase border ${q.correct_answer === oIdx.toString() ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                                        {opt.toUpperCase()} {q.correct_answer === oIdx.toString() && ' (CORRECT)'}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-12 rounded-lg text-center border-2 border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-sm">
                                            <FaClipboardList size={32} />
                                        </div>
                                        <h3 className="text-lg font-normal text-slate-900 uppercase mb-2">No Quiz Available</h3>
                                        <p className="text-[10px] font-normal text-slate-400 uppercase mb-6">
                                            {userRole === 'employee'
                                                ? 'No assessment has been defined for this training.'
                                                : 'Create a quiz to enable assessment for this training.'}
                                        </p>
                                        {userRole !== 'employee' && (
                                            <button
                                                onClick={() => setShowQuizModal(true)}
                                                className="text-primary font-normal text-[10px] uppercase hover:brightness-110 transition-all underline underline-offset-8"
                                            >
                                                + Create Quiz
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Certificate Section */}
                        {activeTab === 'certificate' && (
                            <div className="max-w-4xl mx-auto py-12 animate-fadeIn">
                                {userRole === 'employee' ? (
                                    userProgress?.certificate_issued ? (
                                        <div className="bg-emerald-500 text-white rounded-[4rem] p-24 shadow-2xl shadow-emerald-200 relative overflow-hidden group text-center">
                                            <div className="absolute top-0 right-0 p-16 text-white opacity-10 group-hover:scale-110 transition-transform">
                                                <FaMedal size={240} />
                                            </div>
                                            <div className="relative z-10 space-y-8">
                                                <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto backdrop-blur-md">
                                                    <FaMedal size={40} />
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-4xl font-normal uppercase tracking-normal">Certificate Issued</h3>
                                                    <p className="text-lg font-normal text-emerald-100 uppercase tracking-normal max-w-md mx-auto">Congratulations! You have completed this training.</p>
                                                </div>
                                                <a 
                                                    href={route('certificates.show', userProgress.certificate_id)} 
                                                    target="_blank"
                                                    className="px-12 py-5 bg-white text-emerald-600 rounded-[2rem] text-[11px] font-normal uppercase tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                >
                                                    <FaFileDownload size={14} />
                                                    Download Certificate (PDF)
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-[3rem] border border-slate-200 p-16 shadow-sm text-center">
                                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-100">
                                                <FaLock size={32} />
                                            </div>
                                            <h3 className="text-xl font-normal text-slate-900 uppercase tracking-normal mb-2">Certificate Not Yet Issued</h3>
                                            <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-12">Complete all training requirements to receive your certificate.</p>

                                            <div className="max-w-md mx-auto space-y-4 mb-12 text-left">
                                                {[
                                                    { label: 'Session Attendance', current: userProgress?.sessions_attended || 0, total: training.sessions?.length || 0, icon: FaCalendarAlt },
                                                    { label: 'Materials Viewed', current: userProgress?.materials_viewed?.length || 0, total: training.materials?.length || 0, icon: FaFileDownload },
                                                    { label: 'Quiz Passed', status: quizAttempt?.is_passed ? 'Passed' : 'Pending', icon: FaClipboardList }
                                                ].map((req, i) => (
                                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-lg border border-slate-100 group/req">
                                                        <span className="text-[10px] font-normal text-slate-600 uppercase tracking-normal flex items-center gap-3">
                                                            <req.icon className="text-primary/40 group-hover/req:text-primary transition-colors" size={14} /> {req.label}
                                                        </span>
                                                        {req.status ? (
                                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-normal uppercase tracking-normal border ${req.status === 'AUTHORIZED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                                                {req.status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-normal text-slate-400 tracking-normal">{req.current} / {req.total}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="max-w-xs mx-auto">
                                                <div className="flex justify-between items-baseline mb-4">
                                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">Overall Progress</p>
                                                    <p className="text-xl font-normal text-primary tracking-normal">{userProgress?.progress_percentage || 0}%</p>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-8">
                                                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${userProgress?.progress_percentage || 0}%` }}></div>
                                                </div>
                                                
                                                {userProgress?.progress_percentage === 100 && !userProgress?.certificate_issued && (
                                                    <button onClick={generateCertificate} className="w-full py-4 bg-emerald-600 text-white rounded-lg text-[10px] font-normal uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all animate-bounce">
                                                        Get Certificate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center p-24 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                                        <FaMedal size={64} className="text-slate-200 mx-auto mb-8" />
                                        <h3 className="text-xl font-normal text-slate-900 uppercase tracking-normal mb-2">Certificate Registry</h3>
                                        <p className="text-[10px] font-normal text-slate-400 uppercase tracking-normal mb-12">Certificates are issued automatically when training is completed.</p>
                                        <Link href={route('training-assignments.index', { training_id: training.id })} className="px-8 py-3 bg-white border border-slate-200 text-primary text-[10px] font-normal uppercase tracking-[0.2em] rounded-lg hover:bg-primary/5 transition-all">
                                            View Assignments →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Evaluation Section */}
                        {activeTab === 'evaluation' && (
                            <div className="max-w-3xl mx-auto animate-fadeIn space-y-6">
                                {userRole === 'employee' ? (
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-amber-500 text-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/20">
                                                <FaStar size={24} />
                                            </div>
                                            <h3 className="text-xl font-normal text-slate-900 uppercase mb-2">Training Feedback</h3>
                                            <p className="text-[10px] font-normal text-slate-400 uppercase">Help us improve our training programs.</p>
                                        </div>

                                        <form onSubmit={handleEvaluationSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { label: 'Overall Rating', field: 'rating' },
                                                    { label: 'Content Quality', field: 'content_quality' },
                                                    { label: 'Trainer Effectiveness', field: 'trainer_effectiveness' },
                                                    { label: 'Relevance', field: 'relevance' }
                                                ].map((metric, idx) => (
                                                    <div key={idx} className="space-y-2">
                                                        <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">{metric.label}</label>
                                                        <div className="relative group">
                                                            <select
                                                                value={evaluationForm.data[metric.field]}
                                                                onChange={e => evaluationForm.setData(metric.field, e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none appearance-none cursor-pointer text-[10px] font-normal uppercase"
                                                            >
                                                                <option value="5">5 — EXCELLENT</option>
                                                                <option value="4">4 — GOOD</option>
                                                                <option value="3">3 — FAIR</option>
                                                                <option value="2">2 — POOR</option>
                                                                <option value="1">1 — VERY POOR</option>
                                                            </select>
                                                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={8} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Feedback</label>
                                                <textarea value={evaluationForm.data.feedback_text} onChange={e => evaluationForm.setData('feedback_text', e.target.value)} rows="3" className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none" placeholder="YOUR COMMENTS..."></textarea>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Suggestions</label>
                                                <textarea value={evaluationForm.data.suggestions} onChange={e => evaluationForm.setData('suggestions', e.target.value)} rows="2" className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none" placeholder="ANY IMPROVEMENTS..."></textarea>
                                            </div>

                                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-white hover:border-primary/20 transition-all group/rec">
                                                <input type="checkbox" checked={evaluationForm.data.would_recommend} onChange={e => evaluationForm.setData('would_recommend', e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-primary focus:ring-primary/20" />
                                                <span className="text-[10px] font-normal text-slate-600 uppercase group-hover/rec:text-slate-900 transition-colors">I WOULD RECOMMEND THIS TRAINING</span>
                                            </label>

                                            <button type="submit" disabled={evaluationForm.processing} className="w-full py-3 bg-slate-900 text-white rounded-lg text-[11px] font-normal uppercase hover:bg-primary active:scale-95 transition-all disabled:opacity-50">
                                                Submit Feedback
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="text-center p-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                        <p className="text-[10px] font-normal text-slate-400 uppercase">Feedback analysis in development.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Integrity Guard */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-4">
                    <FaShieldAlt className="text-primary shrink-0 mt-1" size={14} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-normal text-slate-900 uppercase">Data Policy</p>
                        <p className="text-[9px] font-normal text-slate-500 uppercase leading-relaxed">
                            Training records are stored securely. Access is restricted to authorized users.
                        </p>
                    </div>
                </div>
            </div>

            {/* Material Upload Modal */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-zoomIn border border-white/20">
                        <div className="bg-slate-900 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-normal text-white uppercase tracking-normal">Upload Material</h3>
                                <p className="text-[9px] font-normal text-slate-500 uppercase mt-1">Add training materials</p>
                            </div>
                            <button onClick={() => setShowMaterialModal(false)} className="w-8 h-8 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg flex items-center justify-center transition-all"><FaTimesCircle size={14}/></button>
                        </div>
                        <form onSubmit={handleMaterialUpload} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Title</label>
                                <input type="text" value={materialForm.data.title} onChange={e => materialForm.setData('title', e.target.value)} className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary transition-all outline-none" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Description</label>
                                <textarea value={materialForm.data.description} onChange={e => materialForm.setData('description', e.target.value)} className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary transition-all outline-none resize-none" rows="3"></textarea>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">File</label>
                                <input type="file" onChange={e => materialForm.setData('file', e.target.files[0])} className="w-full px-3 py-3 border border-dashed border-slate-300 rounded-[3px] text-[10px] font-normal text-slate-400 uppercase cursor-pointer hover:border-primary transition-colors file:hidden" required />
                            </div>
                            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer group">
                                <input type="checkbox" checked={materialForm.data.is_mandatory} onChange={e => materialForm.setData('is_mandatory', e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-primary focus:ring-primary/20" />
                                <span className="text-[10px] font-normal text-slate-600 uppercase">Mandatory Material</span>
                            </label>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-900 text-[10px] font-normal uppercase hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                                <button type="submit" disabled={materialForm.processing} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-normal uppercase shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quiz Builder Modal */}
            {showQuizModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-zoomIn">
                        <div className="bg-slate-900 px-8 py-6 border-b border-white/10 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-normal text-white uppercase tracking-normal flex items-center gap-3">
                                    <FaClipboardList className="text-primary" /> Quiz Creator
                                </h3>
                                <p className="text-[10px] font-normal text-slate-500 uppercase mt-1">Define assessment details</p>
                            </div>
                            <button onClick={() => setShowQuizModal(false)} className="w-10 h-10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg flex items-center justify-center transition-all"><FaTimesCircle size={16}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8 bg-slate-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Quiz Title</label>
                                    <input type="text" value={quizForm.data.title} onChange={e => quizForm.setData('title', e.target.value)} className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary transition-all outline-none" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Passing Score (%)</label>
                                    <input type="number" value={quizForm.data.passing_score} onChange={e => quizForm.setData('passing_score', e.target.value)} className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary transition-all outline-none" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Time Limit (Mins)</label>
                                    <input type="number" value={quizForm.data.time_limit_minutes} onChange={e => quizForm.setData('time_limit_minutes', e.target.value)} className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary transition-all outline-none" placeholder="UNLIMITED" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[11px] font-normal text-slate-900 uppercase">Questions</h4>
                                    <button type="button" onClick={addQuestion} className="px-4 py-2 bg-primary text-white rounded-lg text-[9px] font-normal uppercase hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95">
                                        <FaPlusCircle size={10} /> Add Question
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {quizForm.data.questions.map((q, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative group/segment animate-slideIn">
                                            <div className="absolute -top-3 -left-3 w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-normal text-lg shadow-lg shadow-slate-900/20">{idx + 1}</div>
                                            <button type="button" onClick={() => removeQuestion(idx)} className="absolute top-4 right-4 w-8 h-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center transition-all opacity-0 group-hover/segment:opacity-100 scale-90 group-hover/segment:scale-100"><FaMinusCircle size={14}/></button>
                                            
                                            <div className="space-y-6 mt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                    <div className="md:col-span-3 space-y-1">
                                                        <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Question</label>
                                                        <input type="text" value={q.question_text} onChange={e => updateQuestion(idx, 'question_text', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[11px] font-normal uppercase focus:bg-white focus:border-primary transition-all outline-none" placeholder="ENTER QUESTION..." required />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-normal text-slate-500 uppercase ml-1">Type</label>
                                                        <div className="relative">
                                                            <select value={q.question_type} onChange={e => updateQuestion(idx, 'question_type', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-[3px] text-[10px] font-normal uppercase focus:bg-white focus:border-primary transition-all outline-none appearance-none cursor-pointer">
                                                                <option value="multiple_choice">MULTIPLE CHOICE</option>
                                                                <option value="true_false">TRUE / FALSE</option>
                                                            </select>
                                                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={8} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pl-8 space-y-4">
                                                    <label className="text-[9px] font-normal text-slate-400 uppercase block mb-2">Options</label>
                                                    {q.question_type === 'multiple_choice' ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {q.options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex gap-3 items-center group/opt">
                                                                    <div className="relative">
                                                                        <input type="radio" name={`correct_${idx}`} checked={q.correct_answer === oIdx.toString()} onChange={() => updateQuestion(idx, 'correct_answer', oIdx.toString())} className="w-5 h-5 rounded border-slate-200 text-primary focus:ring-primary/20" />
                                                                    </div>
                                                                    <input type="text" value={opt} onChange={e => updateOption(idx, oIdx, e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 rounded-[3px] text-[10px] font-normal uppercase border border-transparent focus:bg-white focus:border-primary transition-all outline-none" placeholder={`OPTION ${oIdx + 1}...`} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-6">
                                                            {['true', 'false'].map((val) => (
                                                                <label key={val} className="flex items-center gap-3 cursor-pointer group/tf">
                                                                    <input type="radio" name={`correct_${idx}`} checked={q.correct_answer === val} onChange={() => updateQuestion(idx, 'correct_answer', val)} className="w-5 h-5 rounded border-slate-200 text-primary focus:ring-primary/20" />
                                                                    <span className="text-[10px] font-normal text-slate-500 uppercase group-hover/tf:text-slate-900 transition-colors">{val}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0 justify-end">
                            <button type="button" onClick={() => setShowQuizModal(false)} className="px-6 py-2 border border-slate-200 rounded-lg text-slate-900 text-[10px] font-normal uppercase hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                            <button type="button" onClick={handleQuizCreate} disabled={quizForm.processing} className="px-8 py-2 bg-primary text-white rounded-lg text-[10px] font-normal uppercase shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">Create Quiz</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                show={confirmingQuizDelete}
                onClose={() => setConfirmingQuizDelete(false)}
                onConfirm={handleDeleteQuiz}
                title="Delete Quiz"
                message="Are you sure you want to delete this quiz? This action cannot be undone."
                confirmText="Delete"
                type="danger"
                processing={isDeletingQuiz}
            />

            <ConfirmationModal
                show={confirmingAction.show}
                onClose={closeModal}
                onConfirm={confirmingAction.onConfirm}
                title={confirmingAction.title}
                message={confirmingAction.message}
                confirmText={confirmingAction.type === 'success' ? 'ACKNOWLEDGE' : 'CONFIRM'}
                type={confirmingAction.type}
                hideCancel={confirmingAction.hideCancel}
            />
        </AuthenticatedLayout>
    );
}
