import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Brand & General
    brand: 'HAMS',
    systemName: 'Hostel Asset Management System',
    backToHome: 'Back to Home / Portal',
    homeAndGame: 'Back to Home & Game',
    
    // Auth
    signIn: 'Account Sign In',
    register: 'Register Student Account',
    emailAddress: 'Email Address',
    password: 'Password',
    signInBtn: 'Sign In to Dashboard',
    quickDemo: 'Quick Demo Fill (Examination Viva):',
    newResident: 'New resident?',
    
    // Navbar
    adminRole: 'Hostel Warden / Admin',
    studentRole: 'Hostel Resident / Student',
    settings: 'Settings',
    logout: 'Logout',
    
    // Sidebar
    wardenAdmin: 'Warden Administration',
    studentPortal: 'Student Portal',
    adminDashboard: 'Admin Dashboard',
    manageAssets: 'Manage Assets',
    assetRequests: 'Asset Requests',
    damageLoss: 'Damage & Loss',
    hostelResidents: 'Hostel Residents',
    auditTrail: 'Audit Trail',
    systemSettings: 'System Settings',
    myDashboard: 'My Dashboard',
    myAssignedAssets: 'My Assigned Assets',
    requestAsset: 'Request Asset',
    reportDamageLoss: 'Report Damage / Loss',
    personalHistory: 'Personal History',
    myProfile: 'My Profile',
    accountSettings: 'Account Settings',
    roleLabel: 'Role',
    administrator: 'Administrator',
    hostelResident: 'Hostel Resident',
    
    // Dashboards & Common Pages
    welcome: 'Welcome',
    overview: 'Overview',
    totalAssets: 'Total Assets',
    available: 'Available',
    assigned: 'Assigned',
    damaged: 'Damaged',
    lost: 'Lost',
    maintenance: 'Maintenance',
    pendingRequests: 'Pending Requests',
    approvedRequests: 'Approved Requests',
    totalUsers: 'Total Residents',
    assignedAssets: 'Assigned Assets',
    inRoomPossession: 'In Room Possession',
    awaitingApproval: 'Awaiting Warden Approval',
    processed: 'Processed',
    damageReports: 'Damage Reports',
    defectsReported: 'Defects Reported',
    lostReports: 'Lost Reports',
    missingProperty: 'Missing Property',
    myRoomAssets: 'My Room Assets',
    viewAllAssets: 'View All Assets',
    requestAssetBtn: 'Request Asset',
    reportIssueBtn: 'Report Issue',
    assetCode: 'Asset Code',
    assetName: 'Asset Name',
    category: 'Category',
    roomLocation: 'Room Location',
    condition: 'Condition',
    status: 'Status',
    actions: 'Actions',
    reportDamage: 'Report Damage',
    reportLost: 'Report Lost',
    returnAsset: 'Return / Hand Over Asset',
    handoverAsset: 'Return Asset',
    returnModalTitle: 'Return / Hand Over Asset to Hostel',
    returnReason: 'Reason for Return / Handover',
    handoverCondition: 'Condition upon Handover',
    confirmReturn: 'Confirm Return & Handover',
    hostelBlock: 'Hostel Block',
    roomNumber: 'Room Number',
    rollNumber: 'Roll / Reg No.',
    incidentType: 'Incident Type',
    severity: 'Severity Level',
    description: 'Description of Problem',
    submitReport: 'Submit Report',
    
    // Search & Actions
    searchPlaceholder: 'Search by keyword, asset code...',
    allCategories: 'All Categories',
    allStatuses: 'All Statuses',
    approve: 'Approve',
    reject: 'Reject',
    edit: 'Edit',
    delete: 'Delete',
    inspect: 'Inspect',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    loading: 'Loading...',
    
    // Appearance & Settings
    appearance: 'Appearance & Themes',
    themeMode: 'Theme Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    themeColor: 'Theme Color',
    language: 'Language',
  },

  ta: {
    // Brand & General
    brand: 'HAMS',
    systemName: 'விடுதி சொத்து மேலாண்மை அமைப்பு',
    backToHome: 'முகப்புப் பக்கத்திற்குத் திரும்பு',
    homeAndGame: 'முகப்பு மற்றும் மினி-கேம்',
    
    // Auth
    signIn: 'கணக்கில் உள்நுழைக',
    register: 'மாணவர் கணக்கை பதிவு செய்க',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    signInBtn: 'டாஷ்போர்டில் உள்நுழைக',
    quickDemo: 'மாதிரி உள்நுழைவு (விவா சோதனை):',
    newResident: 'புதிய மாணவரா?',
    
    // Navbar
    adminRole: 'விடுதி வார்டன் / நிர்வாகி',
    studentRole: 'விடுதி மாணவர்',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    
    // Sidebar
    wardenAdmin: 'வார்டன் நிர்வாகம்',
    studentPortal: 'மாணவர் தளம்',
    adminDashboard: 'நிர்வாக டாஷ்போர்டு',
    manageAssets: 'சொத்துக்கள் மேலாண்மை',
    assetRequests: 'சொத்துக் கோரிக்கைகள்',
    damageLoss: 'சேதம் மற்றும் இழப்பு',
    hostelResidents: 'விடுதி மாணவர்கள்',
    auditTrail: 'தணிக்கை வரலாறு',
    systemSettings: 'கணினி அமைப்புகள்',
    myDashboard: 'எனது டாஷ்போர்டு',
    myAssignedAssets: 'எனக்கு ஒதுக்கப்பட்ட சொத்துக்கள்',
    requestAsset: 'சொத்து கோரிக்கை',
    reportDamageLoss: 'சேதம் / இழப்பை புகாரளி',
    personalHistory: 'தனிப்பட்ட வரலாறு',
    myProfile: 'எனது சுயவிவரம்',
    accountSettings: 'கணக்கு அமைப்புகள்',
    roleLabel: 'பங்கு',
    administrator: 'நிர்வாகி',
    hostelResident: 'விடுதி மாணவர்',
    
    // Dashboards & Common Pages
    welcome: 'வணக்கம்',
    overview: 'கண்ணோட்டம்',
    totalAssets: 'மொத்த சொத்துக்கள்',
    available: 'இருப்பில் உள்ளவை',
    assigned: 'ஒதுக்கப்பட்டவை',
    damaged: 'சேதமடைந்தவை',
    lost: 'காணாமல் போனவை',
    maintenance: 'பராமரிப்பில் உள்ளவை',
    pendingRequests: 'நிலுவையில் உள்ள கோரிக்கைகள்',
    approvedRequests: 'ஏற்றுக்கொள்ளப்பட்ட கோரிக்கைகள்',
    totalUsers: 'மொத்த மாணவர்கள்',
    assignedAssets: 'ஒதுக்கப்பட்ட சொத்துக்கள்',
    inRoomPossession: 'அறை வசம் உள்ளவை',
    awaitingApproval: 'வார்டன் ஒப்புதலுக்கு காத்திருக்கிறது',
    processed: 'செயலாக்கப்பட்டது',
    damageReports: 'சேத அறிக்கைகள்',
    defectsReported: 'புகாரளிக்கப்பட்ட குறைபாடுகள்',
    lostReports: 'இழப்பு அறிக்கைகள்',
    missingProperty: 'காணாமல் போன உடைமை',
    myRoomAssets: 'எனது அறை சொத்துக்கள்',
    viewAllAssets: 'அனைத்து சொத்துகளையும் காண்க',
    requestAssetBtn: 'சொத்து கோரிக்கை',
    reportIssueBtn: 'சிக்கலைப் புகாரளி',
    assetCode: 'சொத்துக் குறியீடு',
    assetName: 'சொத்துப் பெயர்',
    category: 'பிரிவு',
    roomLocation: 'அறை இடம்',
    condition: 'நிலை',
    status: 'தற்போதைய நிலை',
    actions: 'செயல்கள்',
    reportDamage: 'சேதத்தைப் புகாரளி',
    reportLost: 'இழப்பைப் புகாரளி',
    returnAsset: 'சொத்தை திரும்ப ஒப்படைக்கவும்',
    handoverAsset: 'சொத்தை திருப்பி கொடு',
    returnModalTitle: 'விடுதி சொத்தை திரும்ப ஒப்படைத்தல்',
    returnReason: 'திரும்ப ஒப்படைப்பதற்கான காரணம்',
    handoverCondition: 'ஒப்படைக்கும் போது உள்ள நிலை',
    confirmReturn: 'திரும்ப ஒப்படைப்பதை உறுதி செய்',
    hostelBlock: 'விடுதி பிரிவு',
    roomNumber: 'அறை எண்',
    rollNumber: 'பதிவு எண்',
    incidentType: 'நிகழ்வு வகை',
    severity: 'தீவிர நிலை',
    description: 'சிக்கலின் விவரம்',
    submitReport: 'அறிக்கையை சமர்ப்பிக்கவும்',
    
    // Search & Actions
    searchPlaceholder: 'சொத்துக் குறியீடு அல்லது பெயரைத் தேடுங்கள்...',
    allCategories: 'அனைத்து பிரிவுகள்',
    allStatuses: 'அனைத்து நிலைகள்',
    approve: 'ஒப்புதல்',
    reject: 'நிராகரி',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    inspect: 'பார்வையிடு',
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
    cancel: 'ரத்து செய்',
    loading: 'ஏற்றுகிறது...',
    
    // Appearance & Settings
    appearance: 'தோற்றம் மற்றும் தீம்',
    themeMode: 'தீம் பயன்முறை',
    lightMode: 'பகல் பயன்முறை',
    darkMode: 'இரவு பயன்முறை',
    themeColor: 'தீம் நிறம்',
    language: 'மொழி',
  },

  ml: {
    // Brand & General
    brand: 'HAMS',
    systemName: 'ഹോസ്റ്റൽ അസറ്റ് മാനേജ്‌മെന്റ് സിസ്റ്റം',
    backToHome: 'ഹോം പേജിലേക്ക് മടങ്ങുക',
    homeAndGame: 'ഹോം & മിനി-ഗെയിം',
    
    // Auth
    signIn: 'സിസ്റ്റത്തിലേക്ക് സൈൻ ഇൻ ചെയ്യുക',
    register: 'വിദ്യാർത്ഥി അക്കൗണ്ട് രജിസ്റ്റർ ചെയ്യുക',
    emailAddress: 'ഇമെയിൽ വിലാസം',
    password: 'പാസ്‌വേഡ്',
    signInBtn: 'ഡാഷ്‌ബോർഡിലേക്ക് സൈൻ ഇൻ ചെയ്യുക',
    quickDemo: 'ഡെമോ ലോഗിൻ (പരീക്ഷാ വൈവ):',
    newResident: 'പുതിയ താമസക്കാരനാണോ?',
    
    // Navbar
    adminRole: 'ഹോസ്റ്റൽ വാർഡൻ / അഡ്മിൻ',
    studentRole: 'ഹോസ്റ്റൽ താമസക്കാരൻ',
    settings: 'ക്രമീകരണങ്ങൾ',
    logout: 'ലോഗ് ഔട്ട്',
    
    // Sidebar
    wardenAdmin: 'വാർഡൻ അഡ്മിനിസ്ട്രേഷൻ',
    studentPortal: 'വിദ്യാർത്ഥി പോർട്ടൽ',
    adminDashboard: 'അഡ്മിൻ ഡാഷ്‌ബോർഡ്',
    manageAssets: 'അസറ്റുകൾ കൈകാര്യം ചെയ്യുക',
    assetRequests: 'അസറ്റ് അഭ്യർത്ഥനകൾ',
    damageLoss: 'കേടുപാടുകളും നഷ്ടവും',
    hostelResidents: 'ഹോസ്റ്റൽ താമസക്കാർ',
    auditTrail: 'ഓഡിറ്റ് രേഖകൾ',
    systemSettings: 'സിസ്റ്റം ക്രമീകരണങ്ങൾ',
    myDashboard: 'എന്റെ ഡാഷ്‌ബോർഡ്',
    myAssignedAssets: 'എനിക്ക് അനുവദിച്ച അസറ്റുകൾ',
    requestAsset: 'അസറ്റ് അഭ്യർത്ഥിക്കുക',
    reportDamageLoss: 'കേടുപാടുകൾ അറിയിക്കുക',
    personalHistory: 'വ്യക്തിഗത ചരിത്രം',
    myProfile: 'എന്റെ പ്രൊഫൈൽ',
    accountSettings: 'അക്കൗണ്ട് ക്രമീകരണങ്ങൾ',
    roleLabel: 'റോൾ',
    administrator: 'അഡ്മിനിസ്ട്രേറ്റർ',
    hostelResident: 'ഹോസ്റ്റൽ താമസക്കാരൻ',
    
    // Dashboards & Common Pages
    welcome: 'സ്വാഗതം',
    overview: 'അവലോകനം',
    totalAssets: 'ആകെ അസറ്റുകൾ',
    available: 'ലഭ്യമായവ',
    assigned: 'അനുവദിച്ചവ',
    damaged: 'കേടായവ',
    lost: 'നഷ്ടപ്പെട്ടവ',
    maintenance: 'അറ്റകുറ്റപ്പണിയിൽ',
    pendingRequests: 'തീർപ്പാക്കാത്ത അഭ്യർത്ഥനകൾ',
    approvedRequests: 'അംഗീകരിച്ച അഭ്യർത്ഥനകൾ',
    totalUsers: 'ആകെ താമസക്കാർ',
    assignedAssets: 'അനുവദിച്ച അസറ്റുകൾ',
    inRoomPossession: 'മുറിയിലുള്ളവ',
    awaitingApproval: 'വാർഡന്റെ അനുമതി കാത്തിരിക്കുന്നു',
    processed: 'പൂർത്തിയായവ',
    damageReports: 'കേടുപാട് റിപ്പോർട്ടുകൾ',
    defectsReported: 'അറിയിച്ച തകരാറുകൾ',
    lostReports: 'നഷ്ടപ്പെട്ട റിപ്പോർട്ടുകൾ',
    missingProperty: 'നഷ്ടപ്പെട്ട വസ്തുക്കൾ',
    myRoomAssets: 'എന്റെ റൂം അസറ്റുകൾ',
    viewAllAssets: 'എല്ലാ അസറ്റുകളും കാണുക',
    requestAssetBtn: 'അസറ്റ് അഭ്യർത്ഥിക്കുക',
    reportIssueBtn: 'പ്രശ്നം അറിയിക്കുക',
    assetCode: 'അസറ്റ് കോഡ്',
    assetName: 'അസറ്റ് പേര്',
    category: 'വിഭാഗം',
    roomLocation: 'റൂം ലൊക്കേഷൻ',
    condition: 'സ്ഥിതി',
    status: 'നില',
    actions: 'നടപടികൾ',
    reportDamage: 'കേടുപാടുകൾ അറിയിക്കുക',
    reportLost: 'നഷ്ടപ്പെട്ടതായി അറിയിക്കുക',
    returnAsset: 'അസറ്റ് തിരികെ നൽകുക',
    handoverAsset: 'അസറ്റ് കൈമാറുക',
    returnModalTitle: 'ഹോസ്റ്റൽ അസറ്റ് തിരികെ കൈമാറുക',
    returnReason: 'തിരികെ നൽകാനുള്ള കാരണം',
    handoverCondition: 'കൈമാറുമ്പോഴുള്ള അവസ്ഥ',
    confirmReturn: 'തിരികെ നൽകൽ സ്ഥിരീകരിക്കുക',
    hostelBlock: 'ഹോസ്റ്റൽ ബ്ലോക്ക്',
    roomNumber: 'റൂം നമ്പർ',
    rollNumber: 'റോൾ നമ്പർ',
    incidentType: 'സംഭവ തരം',
    severity: 'തീവ്രത',
    description: 'വിവരണം',
    submitReport: 'റിപ്പോർട്ട് സമർപ്പിക്കുക',
    
    // Search & Actions
    searchPlaceholder: 'കീവേഡ് അല്ലെങ്കിൽ അസറ്റ് കോഡ് ഉപയോഗിച്ച് തിരയുക...',
    allCategories: 'എല്ലാ വിഭാഗങ്ങളും',
    allStatuses: 'എല്ലാ അവസ്ഥകളും',
    approve: 'അംഗീകരിക്കുക',
    reject: 'നിരസിക്കുക',
    edit: 'മാറ്റം വരുത്തുക',
    delete: 'നീക്കം ചെയ്യുക',
    inspect: 'പരിശോധിക്കുക',
    saveChanges: 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക',
    cancel: 'റദ്ദാക്കുക',
    loading: 'ലോഡുചെയ്യുന്നു...',
    
    // Appearance & Settings
    appearance: 'തീമും രൂപഭംഗിയും',
    themeMode: 'തീം മോഡ്',
    lightMode: 'ലൈറ്റ് മോഡ്',
    darkMode: 'ഡാർക്ക് മോഡ്',
    themeColor: 'തീം നിറം',
    language: 'ഭാഷ',
  },

  hi: {
    // Brand & General
    brand: 'HAMS',
    systemName: 'छात्रावास संपत्ति प्रबंधन प्रणाली',
    backToHome: 'मुख्य पृष्ठ पर वापस जाएं',
    homeAndGame: 'होम एवं मिनी-गेम',
    
    // Auth
    signIn: 'खाता साइन इन करें',
    register: 'छात्र खाता पंजीकृत करें',
    emailAddress: 'ईमेल पता',
    password: 'पासवर्ड',
    signInBtn: 'डैशबोर्ड में साइन इन करें',
    quickDemo: 'त्वरित डेमो लॉगिन (परीक्षा वाइवा):',
    newResident: 'नए छात्र हैं?',
    
    // Navbar
    adminRole: 'छात्रावास वार्डन / प्रशासक',
    studentRole: 'छात्रावास निवासी / छात्र',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    
    // Sidebar
    wardenAdmin: 'वार्डन प्रशासन',
    studentPortal: 'छात्र पोर्टल',
    adminDashboard: 'व्यवस्थापक डैशबोर्ड',
    manageAssets: 'संपत्ति प्रबंधन',
    assetRequests: 'संपत्ति अनुरोध',
    damageLoss: 'क्षति एवं हानि',
    hostelResidents: 'छात्रावास निवासी',
    auditTrail: 'ऑडिट ट्रेल',
    systemSettings: 'सिस्टम सेटिंग्स',
    myDashboard: 'मेरा डैशबोर्ड',
    myAssignedAssets: 'मेरी आवंटित संपत्तियां',
    requestAsset: 'संपत्ति अनुरोध',
    reportDamageLoss: 'क्षति / हानि की रिपोर्ट करें',
    personalHistory: 'व्यक्तिगत इतिहास',
    myProfile: 'मेरी प्रोफाइल',
    accountSettings: 'खाता सेटिंग्स',
    roleLabel: 'भूमिका',
    administrator: 'प्रशासक',
    hostelResident: 'छात्रावास निवासी',
    
    // Dashboards & Common Pages
    welcome: 'स्वागत है',
    overview: 'अवलोकन',
    totalAssets: 'कुल संपत्तियां',
    available: 'उपलब्ध',
    assigned: 'आवंटित',
    damaged: 'क्षतिग्रस्त',
    lost: 'खोया हुआ',
    maintenance: 'रखरखाव में',
    pendingRequests: 'लंबित अनुरोध',
    approvedRequests: 'स्वीकृत अनुरोध',
    totalUsers: 'कुल निवासी',
    assignedAssets: 'आवंटित संपत्तियां',
    inRoomPossession: 'कमरे में उपलब्ध',
    awaitingApproval: 'वार्डन की मंजूरी की प्रतीक्षा',
    processed: 'संसाधित',
    damageReports: 'क्षति रिपोर्ट',
    defectsReported: 'सूचित की गई खामियां',
    lostReports: 'खोई हुई रिपोर्ट',
    missingProperty: 'लापता संपत्ति',
    myRoomAssets: 'मेरे कमरे की संपत्तियां',
    viewAllAssets: 'सभी संपत्तियां देखें',
    requestAssetBtn: 'संपत्ति अनुरोध करें',
    reportIssueBtn: 'समस्या की रिपोर्ट करें',
    assetCode: 'संपत्ति कोड',
    assetName: 'संपत्ति का नाम',
    category: 'श्रेणी',
    roomLocation: 'कमरे का स्थान',
    condition: 'हालत',
    status: 'स्थिति',
    actions: 'क्रियाएं',
    reportDamage: 'क्षति की रिपोर्ट करें',
    reportLost: 'खो जाने की रिपोर्ट करें',
    returnAsset: 'संपत्ति वापस सौंपें',
    handoverAsset: 'संपत्ति लौटाएं',
    returnModalTitle: 'छात्रावास संपत्ति की वापसी / हैंडओवर',
    returnReason: 'वापसी / हैंडओवर का कारण',
    handoverCondition: 'हैंडओवर के समय हालत',
    confirmReturn: 'वापसी सुनिश्चित करें',
    hostelBlock: 'छात्रावास ब्लॉक',
    roomNumber: 'कमरा संख्या',
    rollNumber: 'रोल नंबर',
    incidentType: 'घटना का प्रकार',
    severity: 'गंभीरता स्तर',
    description: 'समस्या का विवरण',
    submitReport: 'रिपोर्ट सबमिट करें',
    
    // Search & Actions
    searchPlaceholder: 'कीवर्ड या संपत्ति कोड द्वारा खोजें...',
    allCategories: 'सभी श्रेणियां',
    allStatuses: 'सभी स्थितियां',
    approve: 'स्वीकृत करें',
    reject: 'अस्वीकार करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    inspect: 'निरीक्षण करें',
    saveChanges: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...',
    
    // Appearance & Settings
    appearance: 'दिखावट एवं थीम',
    themeMode: 'थीम मोड',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    themeColor: 'थीम का रंग',
    language: 'भाषा',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('hams_language') || 'en';
  });

  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem('hams_theme_mode') || 'light';
  });

  const [themeColor, setThemeColorState] = useState(() => {
    return localStorage.getItem('hams_theme_color') || '#2563eb';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.style.setProperty('--primary', themeColor);
  }, [themeMode, themeColor]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('hams_language', lang);
  };

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('hams_theme_mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  };

  const setThemeColor = (color) => {
    setThemeColorState(color);
    localStorage.setItem('hams_theme_color', color);
    document.documentElement.style.setProperty('--primary', color);
  };

  const t = (key) => {
    const langObj = translations[language] || translations.en;
    return langObj[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        themeMode,
        setThemeMode,
        themeColor,
        setThemeColor,
        t,
        translations: translations[language] || translations.en,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
