import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "process": "Process",
        "faq": "FAQ",
        "sessions": "Sessions",
        "book_now": "Book Now",
        "dashboard": "Dashboard"
      },
      "hero": {
        "badge": "REAL DOCTORS. REAL ANSWERS. FROM HOME.",
        "title": "Your smile deserves <em>total protection</em>, starting from your couch.",
        "subtitle": "A 20-minute live video consultation with a licensed dentist who has over 10 years of experience. You book a slot online, join a Zoom call, and ask whatever is on your mind about your or your family's oral health — in plain language, with a real professional.",
        "book_btn": "Book Your Session",
        "price_note": "THE SESSION COSTS $15",
        "features": {
          "no_waiting": "NO WAITING ROOMS",
          "no_prescriptions": "NO PRESCRIPTIONS",
          "same_dentist": "MEET THE SAME DENTIST EVERYTIME"
        }
      },
      "about": {
        "title": "What it is",
        "content": "A 20-minute live video consultation with a licensed dentist who has over 10 years of experience. You book a slot online, join a Zoom call, and ask whatever is on your mind about your or your family's oral health — in plain language, with a real professional. You will meet the same dentist everytime. The session costs $15."
      },
      "benefits": {
        "title": "What you get out of it",
        "content": "Clarity. Direction. Peace of mind. You leave the call knowing whether something is worth worrying about, understanding what good habits look like, and feeling like you have someone in your corner — not a search engine, not a forum, not a chatbot. A real dentist who listened to your specific question and gave you a real answer."
      },
      "disclaimer_text": {
        "title": "What it is not",
        "content": "This is not a clinical appointment. The dentist will not examine your teeth, will not diagnose any condition, and will not prescribe medication or treatment. If you need an X-ray, a filling, a cleaning, or any hands-on procedure, you still need to visit a clinic in person. This service cannot and does not replace that.",
        "replaces": "What it replaces is the unnecessary trip to a clinic just to ask a question — the trip you've been putting off, or the Google rabbit hole you've fallen into at midnight worrying about your child's teeth."
      },
      "who_its_for": {
        "title": "Who it's for",
        "points": [
          "Mothers who want straight answers about their children's teeth.",
          "Adults with questions about their own oral health they've never gotten around to asking.",
          "Anyone who wants to understand a treatment option before committing to it.",
          "Anyone who just wants to know if what they're seeing, feeling, or worrying about is normal."
        ]
      },
      "how_it_works_new": {
        "title": "How it works",
        "steps": [
          { "title": "Book a slot", "text": "Choose a time on the website." },
          { "title": "Pay online", "text": "Secure payment via credit card or Stripe." },
          { "title": "Join the Zoom", "text": "Use the link at your chosen time." },
          { "title": "Ask questions", "text": "Get real answers from a pro." },
          { "title": "Get your report", "text": "Receive your caries risk report by message after the call." }
        ],
        "footer": "That's it — no waiting room, no parking, no sanitizer smell."
      },
      "offer": {
        "title": "Invest in your <em>long-term smile</em>",
        "subtitle": "Get direct access to a licensed dentist for a 20-minute deep-dive into your oral health. No jargon, no sales pitches—just professional clarity from home.",
        "perks": [
          "20 min session with an expert",
          "Personalized oral risk assessment",
          "Expert guidance, no clinic sales",
          "Meet the same doctor everytime"
        ]
      },
      "footer": {
        "motto": "Medical-grade clarity, from home.",
        "services": {
          "title": "Services",
          "one_on_one": "One-on-One Session",
          "webinars": "Group Webinars",
          "community": "Community Access"
        },
        "support": {
          "title": "Support",
          "faq": "FAQ",
          "privacy": "Privacy Policy",
          "terms": "Terms of Service"
        },
        "legal": {
          "copyright": "© 2026 Wiqaiah — by Dr. Muhammad Elberbawi. All rights reserved.",
          "disclaimer": "<strong>DISCLAIMER:</strong> This is a consultative session and <u>not</u> a clinical diagnosis or treatment. For emergencies, please visit your local clinic."
        }
      },
      "faq": {
        "label": "WHAT PEOPLE ASK",
        "title": "No question is too <em>small</em>",
        "questions": [
          "Am I brushing my teeth the right way?",
          "Why do my teeth keep staining?",
          "How can I take care of my baby's teeth?",
          "What's the difference between a bridge and an implant?",
          "My child sucks their thumb — is this harmful?",
          "Is my child's diet making their teeth decay?",
          "Why is my gum bleeding when I brush?",
          "I missed my medication time — what should I do?"
        ]
      },
      "webinars_section": {
        "badge": "LIVE · DR. MUHAMMAD ELBERBAWI",
        "spots_filled": "SPOTS FILLED",
        "fully_booked": "Fully Booked",
        "book_btn": "Register now",
        "label": "LIVE ONLINE WEBINARS",
        "title": "Group sessions on topics that matter",
        "subtitle": "Same expert. Broader topic. A fraction of the price.",
        "view_all": "View all sessions →",
        "empty": "No upcoming webinars at the moment."
      },
      "login_page": {
        "title": "Doctor Login",
        "subtitle": "Login to manage your bookings and webinars.",
        "email": "Email",
        "password": "Password",
        "btn": "Login",
        "logging_in": "Logging in...",
        "success": "Login successful!",
        "failed": "Login failed. Check your credentials.",
        "unauthorized_title": "Access Denied",
        "unauthorized_msg": "You do not have administrative privileges.",
        "forgot_password": "Forgot Password?",
        "reset_sent_success": "Password reset link sent to your email!",
        "reset_sent_error": "Failed to send reset link. Please check the email.",
        "back_to_login": "Back to Login"
      },
      "dashboard_nav": {
        "bookings": "Bookings",
        "availability": "Availability",
        "webinars": "Webinars",
        "content": "Content",
        "settings": "Settings",
        "logout": "Logout",
        "root": "Dashboard"
      },
      "dashboard": {
        "avail": {
          "templates_title": "Weekly Schedule Templates",
          "templates_desc": "Set your recurring weekly availability here. These will be generated every Friday for the next week.",
          "slots_title": "Active Bookable Slots",
          "add_template": "Add Weekly Slot",
          "day": "Day of Week",
          "start": "Start Time",
          "end": "End Time",
          "sync_btn": "Sync Current Week Now",
          "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "no_templates": "No weekly templates set yet.",
          "no_slots": "No active slots found for the coming days.",
          "root_title": "Manage Services & Availability",
          "root_subtitle": "Create and manage your schedule",
          "today": "Today",
          "service_settings": "Booking Settings",
          "add_question": "Add Question",
          "service_duration": "Service Duration",
          "buffer_time": "Add 15 min buffer",
          "max_daily": "Max daily bookings",
          "max_future": "Max future booking window",
          "auto_generate": "Auto-generate slots",
          "available": "Available",
          "unavailable": "Unavailable",
          "save_btn": "Save",
          "cancel_btn": "Cancel",
          "save_success": "Settings saved successfully",
          "save_error": "Failed to save settings",
          "replicate_year": "Generate Slots for a Full Year",
          "replicate_confirm": "This will generate slots for the next 52 weeks based on your current template. Continue?",
          "replicate_success": "Slots generated successfully for the year!",
          "replicate_error": "Error generating slots."
        },
        "bookings": {
          "title": "Consultation Bookings",
          "patient": "Patient Name",
          "date_time": "Date & Time",
          "reason": "Reason",
          "status": "Status",
          "actions": "Actions",
          "pending": "Pending",
          "accepted": "Accepted",
          "rejected": "Rejected",
          "accept_btn": "Accept",
          "accept_dialog_title": "Approve Booking & Send Details",
          "email_label": "Custom Confirmation Message",
          "send_link_btn": "Accept & Send to Patient",
          "cancel": "Cancel",
          "placeholder_link": "Zoom/Google Meet Link",
          "placeholder_email": "Custom message for the patient...",
          "no_bookings": "No bookings found."
        },
        "webinars": {
          "title": "Manage Webinars",
          "create": "Create New",
          "edit": "Edit",
          "registrations": "Registrations",
          "topic": "Topic",
          "description": "Description & Details",
          "date": "Date",
          "price": "Price",
          "capacity": "Capacity",
          "registrants": "Registrants",
          "published": "Published",
          "draft": "Draft",
          "save": "Save Webinar",
          "upload_image": "Webinar Cover Image",
          "meeting_link": "Meeting Link",
          "confirmation_email": "Confirmation Email Content",
          "help_text": "This content will be sent automatically when a registration is approved."
        },
        "settings": {
          "title": "Platform Pricing & Discounts",
          "desc": "Manage the consultation prices and the promotional discount displayed on the landing page.",
          "std_price": "Standard Consultation Price ($)",
          "discount_pct": "Discount Percentage (%)",
          "show_discount": "Show discount on Landing Page",
          "auto_gen_slots": "Auto-generate next week's slots every Friday",
          "badge_en": "Discount Badge Text (English)",
          "badge_ar": "Discount Badge Text (Arabic)",
          "email_template": "Booking Confirmation Email Template",
          "default_webinar_email": "Default Webinar Confirmation Email",
          "save_btn": "Save Settings",
          "saving": "Saving...",
          "success": "Settings updated successfully!",
          "error": "Error saving settings",
          "recovery_email": "Recovery Email",
          "recovery_email_desc": "This email will be used for password recovery if you forget your admin password.",
          "security_title": "Security & Account",
          "change_password": "Change Password",
          "new_password": "New Password",
          "confirm_password": "Confirm New Password",
          "password_mismatch": "Passwords do not match!",
          "password_success": "Password updated successfully!",
          "password_error": "Failed to update password."
        }
      },
      "common": {
        "loading": "Loading...",
        "error": "An error occurred",
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete",
        "back_home": "Back to Home"
      }
    }
  },
  ar: {
    translation: {
      "nav": {
        "process": "خطواتنا",
        "faq": "أسئلة شائعة",
        "sessions": "جلساتنا",
        "book_now": "احجز الآن",
        "dashboard": "لوحة التحكم"
      },
      "hero": {
        "badge": "أطباء حقيقيون. إجابات حقيقية. من منزلك.",
        "title": "ابتسامتك تستحق <em>حماية كاملة</em>، تبدأ من أريكتك.",
        "subtitle": "استشارة فيديو مباشرة مدتها 20 دقيقة مع طبيب أسنان مرخص يتمتع بخبرة تزيد عن 10 سنوات. احجز موعدك أونلاين، انضم لمكالمة Zoom، واسأل عما يدور في ذهنك عن صحة أسنانك أو أسنان عائلتك — بلغة بسيطة وواضحة مع خبير حقيقي.",
        "book_btn": "احجز جلستك الآن",
        "price_note": "تكلفة الجلسة 15 دولاراً",
        "features": {
          "no_waiting": "بدون أي انتظار",
          "no_prescriptions": "بدون وصفات طبية",
          "same_dentist": "ستقابل نفس الطبيب في كل مرة"
        }
      },
      "about": {
        "title": "عن الخدمة",
        "content": "استشارة فيديو مباشرة مدتها 20 دقيقة مع طبيب أسنان مرخص يتمتع بخبرة تزيد عن 10 سنوات. احجز موعدك أونلاين، انضم لمكالمة Zoom، واسأل عما يدور في ذهنك عن صحة أسنانك أو أسنان عائلتك — بلغة بسيطة وواضحة مع خبير حقيقي. ستقابل نفس الطبيب في كل مرة. الجلسة تكلف 15 دولاراً."
      },
      "benefits": {
        "title": "ماذا ستستفيد؟",
        "content": "وضوح. توجيه. راحة بال. ستخرج من المكالمة وأنت تعرف يقيناً إذا كان هناك شيء يستدعي القلق، وتفهم كيف تبدو العادات الصحية السليمة، وتشعر أن هناك من يدعمك — ليس محرك بحث ولا منتدى ولا روبوت دردشة. طبيب أسنان حقيقي استمع لسؤالك المحدد وأعطاك إجابة حقيقية."
      },
      "disclaimer_text": {
        "title": "ما هي ليست عليه",
        "content": "هذا ليس موعداً عيادياً. لن يقوم الطبيب بفحص أسنانك، ولن يشخص أي حالة، ولن يصف دواءً أو علاجاً. إذا كنت بحاجة إلى أشعة، حشو، تنظيف، أو أي إجراء يدوي، فستحتاج لزيارة العيادة شخصياً. هذه الخدمة لا تعوض ولن تعوض ذلك.",
        "replaces": "ما تعوضه هو الرحلة غير الضرورية للعيادة فقط لطرح سؤال — الرحلة التي كنت تؤجلها، أو دوامة القلق التي دخلت فيها على جوجل في منتصف الليل بخصوص أسنان طفلك."
      },
      "who_its_for": {
        "title": "من هو المستفيد؟",
        "points": [
          "الأمهات اللاتي يبحثن عن إجابات مباشرة وسريعة بخصوص أسنان أطفالهن.",
          "البالغون الذين لديهم تساؤلات عن صحة أفواههم ولم يجدوا الوقت لطرحها.",
          "أي شخص يريد فهم خيارات العلاج قبل الالتزام بها.",
          "أي شخص يريد فقط معرفة ما إذا كان ما يراه أو يشعر به طبيعياً."
        ]
      },
      "how_it_works_new": {
        "title": "كيف تعمل الخدمة؟",
        "steps": [
          { "title": "احجز موعدك", "text": "اختر الوقت المناسب لك على الموقع." },
          { "title": "ادفع أونلاين", "text": "دفع آمن عبر الإنترنت." },
          { "title": "انضم للزوم", "text": "استخدم الرابط في الوقت الذي اخترته." },
          { "title": "اطرح أسئلتك", "text": "احصل على إجابات حقيقية من خبير." },
          { "title": "استلم تقريرك", "text": "استلم تقرير تقييم مخاطر التسوس عبر رسالة بعد الجلسة." }
        ],
        "footer": "هذا كل شيء — لا غرف انتظار، لا بحث عن باركينج، ولا رائحة معقمات."
      },
      "offer": {
        "title": "استثمر في <em>ابتسامتك للأمد البعيد</em>",
        "subtitle": "احصل على وصول مباشر لطبيب أسنان مرخص في استشارة فيديو مدتها 20 دقيقة. بدون مصطلحات معقدة، بدون عروض بيع — فقط وضوح مهني من منزلك.",
        "perks": [
          "جلسة 20 دقيقة مع خبير",
          "تقييم مخصص لمخاطر صحة الفم",
          "توجيه مهني بعيداً عن ضغوط العيادات",
          "تقابل نفس الطبيب في كل مرة"
        ]
      },
      "footer": {
        "motto": "وضوح طبي حقيقي، من منزلك.",
        "services": {
          "title": "الخدمات",
          "one_on_one": "جلسات فردية",
          "webinars": "ويبينارز جماعية",
          "community": "الوصول للمجتمع"
        },
        "support": {
          "title": "الدعم",
          "faq": "الأسئلة الشائعة",
          "privacy": "سياسة الخصوصية",
          "terms": "شروط الخدمة"
        },
        "legal": {
          "copyright": "© 2026 وقاية — بواسطة د. محمد البرباوي. جميع الحقوق محفوظة.",
          "disclaimer": "<strong>إخلاء مسؤولية:</strong> هذه جلسة استشارية <u>وليست</u> تشخيصاً أو علاجاً عيادياً. للحالات الطارئة، يرجى زيارة أقرب عيادة."
        }
      },
      "faq": {
        "label": "ماذا يسأل الناس",
        "title": "لا يوجد سؤال <em>صغير جداً</em>",
        "questions": [
          "هل أقوم بتنظيف أسناني بالطريقة الصحيحة؟",
          "لماذا تستمر أسناني في التصبغ؟",
          "كيف يمكنني الاعتناء بأسنان طفلي الرضيع؟",
          "ما الفرق بين الجسر والزرعة؟",
          "طفلي يمص إبهامه — هل هذا ضار؟",
          "هل يؤثر نظام طفلي الغذائي على تسوس أسنانه؟",
          "لماذا تنزف لثتي عند التنظيف؟",
          "لقد نسيت موعد الدواء — ماذا يجب أن أفعل؟"
        ]
      },
      "webinars_section": {
        "badge": "مباشر · د. محمد البرباوي",
        "spots_filled": "مقعد محجوز",
        "fully_booked": "اكتمل العدد",
        "book_btn": "سجل الآن",
        "label": "دروس مباشرة أونلاين",
        "title": "جلسات جماعية حول مواضيع تهمك",
        "subtitle": "نفس الخبير. مواضيع أشمل. وبجزء بسيط من السعر.",
        "view_all": "عرض جميع الجلسات ←",
        "empty": "لا توجد ويبينارز قادمة حالياً."
      },
      "login_page": {
        "title": "دخول الطبيب",
        "subtitle": "قم بتسجيل الدخول لإدارة حجوزاتك والويبينارز.",
        "email": "البريد الإلكتروني",
        "password": "كلمة المرور",
        "btn": "دخول",
        "logging_in": "جاري الدخول...",
        "success": "تم الدخول بنجاح!",
        "failed": "خطأ في الدخول. تأكد من البيانات.",
        "unauthorized_title": "تم رفض الدخول",
        "unauthorized_msg": "ليس لديك صلاحيات المسؤول.",
        "forgot_password": "نسيت كلمة المرور؟",
        "reset_sent_success": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني!",
        "reset_sent_error": "فشل إرسال الرابط. تأكد من البريد الإلكتروني.",
        "back_to_login": "العودة لتسجيل الدخول"
      },
      "dashboard_nav": {
        "bookings": "الحجوزات",
        "availability": "المواعيد",
        "webinars": "الويبنارز",
        "content": "المحتوى",
        "settings": "الإعدادات",
        "logout": "تسجيل الخروج",
        "root": "لوحة التحكم"
      },
      "dashboard": {
        "avail": {
          "templates_title": "قوالب الجدول الأسبوعي",
          "templates_desc": "حدد مواعيدك الأسبوعية المتكررة هنا. سيتم توليدها تلقائياً كل يوم جمعة للأسبوع القادم.",
          "slots_title": "المواعيد المتاحة حالياً للحجز",
          "add_template": "إضافة موعد أسبوعي",
          "day": "اليوم",
          "start": "وقت البدء",
          "end": "وقت الانتهاء",
          "sync_btn": "توليد مواعيد الأسبوع الحالي الآن",
          "days": ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
          "no_templates": "لم يتم ضبط أي قوالب أسبوعية بعد.",
          "no_slots": "لا توجد مواعيد نشطة للأيام القادمة.",
          "root_title": "إدارة مواعيدك و خدماتك",
          "root_subtitle": "قم بإنشاء وإدارة جدولك الزمني",
          "today": "اليوم",
          "service_settings": "إحصائيات المواعيد",
          "add_question": "أضف سؤال",
          "service_duration": "وقت الخدمة",
          "buffer_time": "إضافة 15 دقيقة راحة",
          "max_daily": "الحد الأقصى للحجوزات اليومية",
          "max_future": "أبعد موعد للحجز",
          "auto_generate": "توليد المواعيد تلقائياً",
          "available": "متاح",
          "unavailable": "غير متاح",
          "save_btn": "حفظ",
          "cancel_btn": "إلغاء",
          "save_success": "تم حفظ الإعدادات بنجاح",
          "save_error": "فشل حفظ الإعدادات",
          "replicate_year": "توليد مواعيد للسنة كاملة",
          "replicate_confirm": "سيتم توليد مواعيد لـ 52 أسبوعاً قادماً بناءً على جدولك الحالي. هل تريد الاستمرار؟",
          "replicate_success": "تم توليد مواعيد السنة بنجاح!",
          "replicate_error": "حدث خطأ أثناء توليد المواعيد."
        },
        "bookings": {
          "title": "حجوزات الاستشارات",
          "patient": "اسم المريض",
          "date_time": "التاريخ والوقت",
          "reason": "السبب",
          "status": "الحالة",
          "actions": "الإجراءات",
          "pending": "قيد الانتظار",
          "accepted": "تم القبول",
          "rejected": "مرفوض",
          "accept_btn": "قبول",
          "accept_dialog_title": "قبول الحجز وإرسال التفاصيل",
          "email_label": "نص رسالة التأكيد المخصصة",
          "send_link_btn": "قبول وإرسال للمريض",
          "cancel": "إلغاء",
          "placeholder_link": "رابط زووم أو جوجل ميت",
          "placeholder_email": "رسالة مخصصة للمريض...",
          "no_bookings": "لا توجد حجوزات حالياً."
        },
        "webinars": {
          "title": "إدارة الويبينارز",
          "create": "إنشاء جديد",
          "edit": "تعديل",
          "registrations": "التسجيلات",
          "topic": "الموضوع",
          "description": "وصف وتفاصيل الويبينار",
          "date": "التاريخ",
          "price": "السعر",
          "capacity": "السعة",
          "registrants": "المسجلين",
          "published": "منشور",
          "draft": "مسودة",
          "save": "حفظ الويبينار",
          "upload_image": "صورة الغلاف",
          "meeting_link": "رابط الاجتماع",
          "confirmation_email": "محتوى إيميل التأكيد",
          "help_text": "سيتم إرسال هذا المحتوى تلقائياً عند الموافقة على التسجيل."
        },
        "settings": {
          "title": "أسعار المنصة والخصومات",
          "desc": "إدارة أسعار الاستشارات والخصم الترويجي الذي يظهر في الصفحة الرئيسية.",
          "std_price": "سعر الاستشارة القياسي ($)",
          "discount_pct": "نسبة الخصم (%)",
          "show_discount": "إظهار الخصم في الصفحة الرئيسية",
          "auto_gen_slots": "توليد مواعيد الأسبوع تلقائياً كل جمعة",
          "badge_en": "نص شارة الخصم (إنجليزي)",
          "badge_ar": "نص شارة الخصم (عربي)",
          "email_template": "قالب إيميل تأكيد الحجز",
          "default_webinar_email": "إيميل تأكيد الويبينار الافتراضي",
          "save_btn": "حفظ الإعدادات",
          "saving": "جاري الحفظ...",
          "success": "تم تحديث الإعدادات بنجاح!",
          "error": "خطأ في حفظ الإعدادات",
          "recovery_email": "بريد الطوارئ / الاسترداد",
          "recovery_email_desc": "سيتم استخدام هذا البريد لاستعادة كلمة المرور في حال نسيانها.",
          "security_title": "الأمان والحساب",
          "change_password": "تغيير كلمة المرور",
          "new_password": "كلمة المرور الجديدة",
          "confirm_password": "تأكيد كلمة المرور الجديدة",
          "password_mismatch": "كلمات المرور غير متطابقة!",
          "password_success": "تم تحديث كلمة المرور بنجاح!",
          "password_error": "فشل تحديث كلمة المرور."
        }
      },
      "common": {
        "loading": "جاري التحميل...",
        "error": "حدث خطأ ما",
        "save": "حفظ",
        "cancel": "إلغاء",
        "delete": "حذف",
        "back_home": "العودة للرئيسية"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
