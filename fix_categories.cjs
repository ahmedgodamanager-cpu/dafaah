const fs = require('fs');
let content = fs.readFileSync('src/data/initialClients.ts', 'utf8');

const oldLogic = `  const getAllowedCategories = (contract: string): TaskCategory[] => {
    const c = contract.toLowerCase();
    if (c.includes('سوشيال ميديا') && !c.includes('ميديا (')) return ['account_management', 'social_media'];
    if (c.includes('ميديا (') || c.includes('media')) return ['account_management', 'media_buying', 'social_media'];
    if (c.includes('انشاء') || c.includes('seo')) return ['account_management', 'seo'];
    if (c.includes('براندينج') || c.includes('الاقتصادية')) return ['account_management', 'social_media'];
    
    // Default to everything for full package or unhandled
    return ['account_management', 'seo', 'media_buying', 'social_media'];
  };`;

const newLogic = `  const getAllowedCategories = (contract: string): TaskCategory[] => {
    const c = contract.toLowerCase();
    
    // فل باكدج -> All Categories
    if (c.includes('فل باكدج') || c.includes('full package')) {
      return ['account_management', 'seo', 'media_buying', 'social_media'];
    }
    
    // سوشيال ميديا فقط -> Account + Social Media
    if (c.includes('سوشيال ميديا') && !c.includes('ميديا (')) {
      return ['account_management', 'social_media'];
    }
    
    // باقات الميديا بكل أنواعها (حملات، برودكشن، الخ) -> Account + Social Media + Media Buying (بدون سيو)
    if (c.includes('ميديا') || c.includes('media') || c.includes('فيديوهات')) {
      return ['account_management', 'media_buying', 'social_media'];
    }
    
    // انشاء -> Account + SEO
    if (c.includes('انشاء') || c.includes('seo')) {
      return ['account_management', 'seo'];
    }
    
    // براندينج / الاقتصادية -> Account + Social Media
    if (c.includes('براندينج') || c.includes('الاقتصادية')) {
      return ['account_management', 'social_media'];
    }
    
    // Default to everything
    return ['account_management', 'seo', 'media_buying', 'social_media'];
  };`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/data/initialClients.ts', content);
