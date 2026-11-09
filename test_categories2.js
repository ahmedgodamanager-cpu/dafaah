const getAllowedCategories = (contract) => {
    const c = contract.toLowerCase();
    
    // فل باكدج -> All
    if (c.includes('فل باكدج') || c.includes('full package')) {
      return ['account_management', 'seo', 'media_buying', 'social_media'];
    }
    
    // سوشيال ميديا -> Only Social Media (check this before generic 'ميديا')
    if (c.includes('سوشيال ميديا') && !c.includes('ميديا (')) {
      return ['account_management', 'social_media'];
    }
    
    // ميديا بكل أنواعها (حملات إعلانية، برودكشن، الخ) -> Social Media + Media Buying (No SEO)
    if (c.includes('ميديا') || c.includes('media') || c.includes('فيديوهات')) {
      return ['account_management', 'media_buying', 'social_media'];
    }
    
    // انشاء -> SEO
    if (c.includes('انشاء') || c.includes('seo')) {
      return ['account_management', 'seo'];
    }
    
    // براندينج / الاقتصادية
    if (c.includes('براندينج') || c.includes('الاقتصادية')) {
      return ['account_management', 'social_media'];
    }
    
    // Default to everything for unhandled (though we handled most)
    return ['account_management', 'seo', 'media_buying', 'social_media'];
  };

console.log("فل باكدج:", getAllowedCategories("فل باكدج"));
console.log("ميديا ( حملات اعلانية + سوشيال ):", getAllowedCategories("ميديا ( حملات اعلانية + سوشيال )"));
console.log("ميديا برودكشن ( فيديوهات ):", getAllowedCategories("ميديا برودكشن ( فيديوهات )"));
console.log("سوشيال ميديا:", getAllowedCategories("سوشيال ميديا"));
console.log("ميديا:", getAllowedCategories("ميديا"));
console.log("الاقتصادية:", getAllowedCategories("الاقتصادية"));
