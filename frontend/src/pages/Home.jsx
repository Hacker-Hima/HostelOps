import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Globe,
} from 'lucide-react';

// Multi-language translation dictionary
const translations = {
  en: {
    brand: 'HAMS',
    subtitle: 'Hostel Asset Management System',
    signInNav: 'Sign In',
    registerNav: 'Register Student',
    goToDashboard: 'Go to Dashboard',
    campusCaption: 'Campus Residential Facilities & Inventory Operations',
    portalTitle: 'Hostel Operations Portal',
    portalSubtitle: 'Access resident services, manage hostel inventory, or configure appearance and preferences.',
    signInCardTitle: 'Sign In to System',
    signInCardDesc: 'Access Warden Administration or Student Resident Room Inventory portal.',
    signInBtn: 'Go to Sign In Page',
    registerCardTitle: 'Resident Registration',
    registerCardDesc: 'Enroll your student account and room number to manage assigned assets.',
    registerBtn: 'Register Student Account',
    settingsBarTitle: 'Portal Appearance & Preferences',
    themeMode: 'Theme Mode',
    light: 'Light',
    dark: 'Dark',
    accentColor: 'Theme Color',
    language: 'Language',
    gameTitle: 'Hostel Asset Mini-Game',
    gameSubtitle: 'Match the hostel inventory pairs to test your memory & speed!',
    score: 'Score',
    moves: 'Moves',
    resetGame: 'Restart Game',
    gameWon: '🎉 Congratulations! All hostel assets successfully matched and sorted!',
    playAgain: 'Play Again',
    modulesTitle: 'System Modules',
    card1Title: 'Asset Tracking & Inventory',
    card1Desc: 'Full lifecycle tracking for beds, furniture, electronics, and common facilities with unique asset codes.',
    card2Title: 'Bulk CSV Import & Export',
    card2Desc: 'Upload CSV sheets with automated duplicate detection & data validation; export filtered asset catalogs.',
    card3Title: 'Pagination & Real-Time Querying',
    card3Desc: 'High performance server-side pagination, dynamic keyword search, multi-condition filtering, and column sorting.',
    card4Title: 'Immutable Audit History',
    card4Desc: 'Detailed audit trail recording who created, allocated, modified, or repaired each hostel asset.',
    footerText: 'Hostel Asset Management System (HAMS) • Modern Web Technologies Full Stack Project',
  },
  ta: {
    brand: 'HAMS',
    subtitle: 'விடுதி சொத்து மேலாண்மை அமைப்பு',
    signInNav: 'உள்நுழைக',
    registerNav: 'மாணவர் பதிவு',
    goToDashboard: 'டாஷ்போர்டுக்கு செல்',
    campusCaption: 'விடுதி வளாக குடியிருப்பு வசதிகள் மற்றும் இருப்பு செயல்பாடுகள்',
    portalTitle: 'விடுதி செயல்பாடுகள் போர்டல்',
    portalSubtitle: 'விடுதி உபகரணங்கள், அறை ஒதுக்கீடுகள் மற்றும் சேவை கோரிக்கைகளுக்கான பிரதான தளம்.',
    signInCardTitle: 'கணக்கில் உள்நுழைக',
    signInCardDesc: 'வார்டன் நிர்வாகம் அல்லது மாணவர் அறை சொத்து போர்ட்டலை அணுகவும்.',
    signInBtn: 'உள்நுழைவு பக்கத்திற்கு செல்லவும்',
    registerCardTitle: 'புதிய மாணவர் பதிவு',
    registerCardDesc: 'சொத்து ஒதுக்கீடுகளை பெற மாணவர் கணக்கு மற்றும் அறை எண்ணை பதிவு செய்க.',
    registerBtn: 'மாணவர் கணக்கை பதிவு செய்க',
    settingsBarTitle: 'போர்டல் தோற்றம் மற்றும் அமைப்புகள்',
    themeMode: 'தீம் பயன்முறை',
    light: 'பகல்',
    dark: 'இரவு',
    accentColor: 'வண்ண தீம்',
    language: 'மொழி',
    gameTitle: 'விடுதி சொத்து மினி-கேம்',
    gameSubtitle: 'விடுதி உபகரணங்களை இணைத்து உங்கள் நினைவாற்றலை சோதிக்கவும்!',
    score: 'மதிப்பெண்',
    moves: 'நகர்வுகள்',
    resetGame: 'மீண்டும் தொடங்கவும்',
    gameWon: '🎉 வாழ்த்துகள்! அனைத்து விடுதி உபகரணங்களும் வெற்றிகரமாக சரிபார்க்கப்பட்டன!',
    playAgain: 'மீண்டும் விளையாடுங்கள்',
    modulesTitle: 'அமைப்பின் சிறப்பம்சங்கள்',
    card1Title: 'சொத்து கண்காணிப்பு மற்றும் இருப்பு',
    card1Desc: 'கட்டில்கள், தளபாடங்கள், மின்சாதனங்கள் ஆகியவற்றின் முழுமையான கண்காணிப்பு.',
    card2Title: 'CSV பதிவேற்றம் மற்றும் ஏற்றுமதி',
    card2Desc: 'தானியங்கி சரிபார்ப்புடன் கூடிய CSV கோப்பு பதிவேற்றம் மற்றும் பதிவிறக்கம்.',
    card3Title: 'பக்கமாக்கல் மற்றும் தேடல்',
    card3Desc: 'உயர் செயல்திறன் கொண்ட சர்வர் பக்க தேடல் மற்றும் வரிசைப்படுத்துதல்.',
    card4Title: 'தணிக்கை மற்றும் வரலாற்று பதிவுகள்',
    card4Desc: 'ஒவ்வொரு சொத்தின் மாற்றங்கள் மற்றும் பழுதுபார்ப்புகளின் முழுமையான தணிக்கை பதிவு.',
    footerText: 'விடுதி சொத்து மேலாண்மை அமைப்பு (HAMS) • நவீன வலைத் தொழில்நுட்பங்கள் திட்டம்',
  },
  ml: {
    brand: 'HAMS',
    subtitle: 'ഹോസ്റ്റൽ അസറ്റ് മാനേജ്‌മെന്റ് സിസ്റ്റം',
    signInNav: 'സൈൻ ഇൻ',
    registerNav: 'വിദ്യാർത്ഥി രജിസ്ട്രേഷൻ',
    goToDashboard: 'ഡാഷ്‌ബോർഡിലേക്ക് പോകുക',
    campusCaption: 'ക്യാമ്പസ് റസിഡൻഷ്യൽ സൗകര്യങ്ങളും ഇൻവെന്ററിയും',
    portalTitle: 'ഹോസ്റ്റൽ ഓപ്പറേഷൻസ് പോർട്ടൽ',
    portalSubtitle: 'ഹോസ്റ്റൽ ഇൻവെന്ററി, റൂം അലോക്കേഷൻ, സർവീസ് അഭ്യർത്ഥനകൾ എന്നിവ കൈകാര്യം ചെയ്യുക.',
    signInCardTitle: 'സിസ്റ്റത്തിലേക്ക് സൈൻ ഇൻ ചെയ്യുക',
    signInCardDesc: 'വാർഡൻ അഡ്മിനിസ്ട്രേഷൻ അല്ലെങ്കിൽ വിദ്യാർത്ഥി റൂം പോർട്ടലിൽ പ്രവേശിക്കുക.',
    signInBtn: 'സൈൻ ഇൻ പേജിലേക്ക് പോകുക',
    registerCardTitle: 'റസിഡന്റ് രജിസ്ട്രേഷൻ',
    registerCardDesc: 'മുറിയിലെ സാധനങ്ങൾ കൈകാര്യം ചെയ്യാൻ വിദ്യാർത്ഥി അക്കൗണ്ട് രജിസ്റ്റർ ചെയ്യുക.',
    registerBtn: 'വിദ്യാർത്ഥി അക്കൗണ്ട് രജിസ്റ്റർ ചെയ്യുക',
    settingsBarTitle: 'പോർട്ടൽ ക്രമീകരണങ്ങളും തീമും',
    themeMode: 'തീം മോഡ്',
    light: 'ലൈറ്റ്',
    dark: 'ഡാർക്ക്',
    accentColor: 'കളർ മോഡ്',
    language: 'ഭാഷ',
    gameTitle: 'ഹോസ്റ്റൽ അസറ്റ് മിനി-ഗെയിം',
    gameSubtitle: 'ഹോസ്റ്റൽ ഉപകരണങ്ങൾ പൊരുത്തപ്പെടുത്തി ഓർമ്മശക്തി പരിശോധിക്കുക!',
    score: 'സ്കോർ',
    moves: 'നീക്കങ്ങൾ',
    resetGame: 'വീണ്ടും തുടങ്ങുക',
    gameWon: '🎉 അഭിനന്ദനങ്ങൾ! എല്ലാ ഹോസ്റ്റൽ അസറ്റുകളും പൊരുത്തപ്പെട്ടു!',
    playAgain: 'വീണ്ടും കളിക്കുക',
    modulesTitle: 'സിസ്റ്റം ഘടകങ്ങൾ',
    card1Title: 'അസറ്റ് ട്രാക്കിംഗും ഇൻവെന്ററിയും',
    card1Desc: 'കിടക്കകൾ, ഫർണിച്ചറുകൾ, ഇലക്ട്രോണിക്സ് എന്നിവയുടെ സമഗ്ര ട്രാക്കിംഗ്.',
    card2Title: 'ബൾക്ക് CSV ഇംപോർട്ട് & എക്‌സ്‌പോർട്ട്',
    card2Desc: 'ഡ്യൂപ്ലിക്കേഷൻ പരിശോധനയോടെയുള്ള CSV അപ്‌ലോഡും ഡൗൺലോഡും.',
    card3Title: 'പേജിനേഷനും തത്സമയ തിരയലും',
    card3Desc: 'സെർവർ സൈഡ് പേജിനേഷനും ഫിൽട്ടറിംഗും.',
    card4Title: 'ഓഡിറ്റ് ഹിസ്റ്ററിയും രേഖകളും',
    card4Desc: 'ഓരോ ഉപകരണത്തിന്റെയും വിശദമായ ചരിത്ര രേഖകൾ.',
    footerText: 'ഹോസ്റ്റൽ അസറ്റ് മാനേജ്‌മെന്റ് സിസ്റ്റം (HAMS) • മോഡേൺ വെബ് ടെക്നോളജീസ് പ്രൊജക്റ്റ്',
  },
  hi: {
    brand: 'HAMS',
    subtitle: 'छात्रावास संपत्ति प्रबंधन प्रणाली',
    signInNav: 'साइन इन',
    registerNav: 'छात्र पंजीकरण',
    goToDashboard: 'डैशबोर्ड पर जाएं',
    campusCaption: 'परिसर आवासीय सुविधाएं और इन्वेंट्री संचालन',
    portalTitle: 'छात्रावास संचालन पोर्टल',
    portalSubtitle: 'छात्रावास सामग्री, कमरा आवंटन और सेवा अनुरोधों का प्रबंधन करें।',
    signInCardTitle: 'सिस्टम में साइन इन करें',
    signInCardDesc: 'वार्डन प्रशासन या छात्र कक्ष संपत्ति पोर्टल तक पहुंचें।',
    signInBtn: 'साइन इन पेज पर जाएं',
    registerCardTitle: 'आवासीय छात्र पंजीकरण',
    registerCardDesc: 'आवंटित संपत्तियों के प्रबंधन हेतु छात्र खाता पंजीकृत करें।',
    registerBtn: 'छात्र खाता पंजीकृत करें',
    settingsBarTitle: 'पोर्टल सेटिंग्स और थीम',
    themeMode: 'थीम मोड',
    light: 'लाइट',
    dark: 'डार्क',
    accentColor: 'रंग मोड',
    language: 'भाषा',
    gameTitle: 'होस्टल एसेट मिनी-गेम',
    gameSubtitle: 'स्मृति और गति परखने के लिए होस्टल वस्तुओं का मिलान करें!',
    score: 'स्कोर',
    moves: 'चालें',
    resetGame: 'पुनः प्रारंभ करें',
    gameWon: '🎉 बधाई! सभी संपत्तियों का सफलतापूर्वक मिलान हो गया!',
    playAgain: 'पुनः खेलें',
    modulesTitle: 'प्रणाली की विशेषताएं',
    card1Title: 'संपत्ति ट्रैकिंग और इन्वेंटरी',
    card1Desc: 'बेड, फर्नीचर और इलेक्ट्रॉनिक्स का संपूर्ण जीवन चक्र ट्रैकिंग।',
    card2Title: 'बल्क CSV इम्पोर्ट और एक्सपोर्ट',
    card2Desc: 'स्वचालित सत्यापन के साथ CSV अपलोड और डाउनलोड।',
    card3Title: 'पेजिनेशन और रियल-टाइम सर्च',
    card3Desc: 'कुशल सर्वर-साइड पेजिनेशन और फिल्टरिंग।',
    card4Title: 'अपरिवर्तनीय ऑडिट इतिहास',
    card4Desc: 'प्रत्येक संपत्ति की गतिविधि का विस्तृत लॉग।',
    footerText: 'छात्रावास संपत्ति प्रबंधन प्रणाली (HAMS) • मॉडर्न वेब टेक्नोलॉजीज प्रोजेक्ट',
  },
};

const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { language: lang, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSelectLang = (newLang) => {
    setLanguage(newLang);
  };

  const t = translations[lang] || translations.en;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Top Header */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 3rem',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 size={28} color="var(--primary)" />
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {t.brand}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Quick Language Dropdown in Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
            <Globe size={16} color="var(--primary)" />
            <select
              value={lang}
              onChange={(e) => handleSelectLang(e.target.value)}
              className="form-control"
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.8rem',
                height: 'auto',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                borderColor: 'var(--border)',
              }}
            >
              <option value="en">English (English)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {isAuthenticated ? (
            <Link
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className="btn btn-primary"
            >
              <span>{t.goToDashboard}</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                {t.signInNav}
              </Link>
              <Link to="/register" className="btn btn-primary">
                {t.registerNav}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            color: 'var(--text-main)',
            marginBottom: '0.4rem',
          }}
        >
          {t.brand}
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--primary)',
            fontWeight: 600,
            marginBottom: '2rem',
          }}
        >
          {t.subtitle}
        </p>

        {/* Hostel Campus Image Showcase */}
        <div
          style={{
            position: 'relative',
            maxWidth: '960px',
            margin: '0 auto 2.5rem',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.22)',
            border: '1px solid var(--border)',
          }}
        >
          <img
            src="/hostel_campus.jpg"
            alt="Hostel Campus"
            style={{
              width: '100%',
              height: '420px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1.25rem',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <Building2 size={16} color="#60a5fa" />
            <span>{t.campusCaption}</span>
          </div>
        </div>

        {/* ========================================================
            PORTAL DASHBOARD SECTION
            Includes: Direct Sign In Access & Mini-Game
           ======================================================== */}
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto 3rem',
            textAlign: 'left',
          }}
        >
          {/* 1. Portal Quick Action Cards (Direct entry to Sign In & Register) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Go to Sign In Page Card */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={22} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {t.signInCardTitle}
                  </h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {t.signInCardDesc}
                </p>
              </div>

              <Link
                to="/login"
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                id="btn-portal-signin"
              >
                <span>{t.signInBtn}</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Go to Register Page Card */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <UserCheck size={22} color="#059669" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {t.registerCardTitle}
                  </h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {t.registerCardDesc}
                </p>
              </div>

              <Link
                to="/register"
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                id="btn-portal-register"
              >
                <span>{t.registerBtn}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          marginTop: '4rem',
          backgroundColor: 'var(--bg-card)',
          transition: 'all 0.3s ease',
        }}
      >
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
};

export default Home;
