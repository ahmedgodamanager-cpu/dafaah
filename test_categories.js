const getAllowedCategories = (contract) => {
    const c = contract.toLowerCase();
    if (c.includes('سوشيال ميديا') && !c.includes('ميديا (')) return ['account_management', 'social_media'];
    if (c.includes('ميديا (') || c.includes('media')) return ['account_management', 'media_buying', 'social_media'];
    if (c.includes('انشاء') || c.includes('seo')) return ['account_management', 'seo'];
    if (c.includes('براندينج') || c.includes('الاقتصادية')) return ['account_management', 'social_media'];
    
    // Default to everything for full package or unhandled
    return ['account_management', 'seo', 'media_buying', 'social_media'];
  };

console.log("فل باكدج:", getAllowedCategories("فل باكدج"));
console.log("ميديا ( حملات اعلانية + سوشيال ):", getAllowedCategories("ميديا ( حملات اعلانية + سوشيال )"));
console.log("ميديا برودكشن ( فيديوهات ):", getAllowedCategories("ميديا برودكشن ( فيديوهات )"));
console.log("سوشيال ميديا:", getAllowedCategories("سوشيال ميديا"));
console.log("الاقتصادية:", getAllowedCategories("الاقتصادية"));
