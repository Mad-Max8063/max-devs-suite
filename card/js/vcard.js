// ============================================
// vcard.js — vCard 3.0 generation & download
// ============================================

export function generateVCard(data) {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${data.name || ''}`,
        `N:${(data.name || '').split(' ').reverse().join(';')};;;`,
    ];

    if (data.profession) {
        lines.push(`ORG:${data.profession}`);
        lines.push(`TITLE:${data.profession}`);
    }

    if (data.phone) {
        lines.push(`TEL;TYPE=CELL:${data.phone}`);
    }

    if (data.email) {
        lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
    }

    if (data.location) {
        lines.push(`ADR;TYPE=WORK:;;${data.location};;;;`);
    }

    if (data.website) {
        lines.push(`URL:${data.website}`);
    }

    if (data.instagram) {
        lines.push(`X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${data.instagram.replace('@', '')}`);
    }

    if (data.linkedin) {
        lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${data.linkedin}`);
    }

    if (data.description) {
        lines.push(`NOTE:${data.description}`);
    }

    // Add photo if available
    if (data.photo && data.photo.startsWith('data:image')) {
        const base64 = data.photo.split(',')[1];
        if (base64 && base64.length < 50000) {
            lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${base64}`);
        }
    } else if (data.photo && data.photo.startsWith('https://')) {
        lines.push(`PHOTO;VALUE=uri:${data.photo}`);
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
}

export function downloadVCard(data) {
    const vcardContent = generateVCard(data);
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.name || 'contacto').replace(/\s+/g, '_')}.vcf`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100);
}
