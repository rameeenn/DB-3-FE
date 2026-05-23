// components/cards/ResidentNonMemberCard.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { CardData, CardComponentProps } from './types';

interface ResidentNonMemberCardProps extends CardComponentProps {
  side: 'front' | 'back';
}

export default function ResidentNonMemberCard({ data, side, cardRef, isDownload = false }: ResidentNonMemberCardProps) {
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);
  const ref = cardRef || localRef;

  const getProxiedImageUrl = (originalUrl: string | null) => {
    if (!originalUrl) return null;
    if (originalUrl.startsWith('/')) return originalUrl;
    return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  };

  const formatToMonthYear = (dateString: string): string => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
  };

  const formattedIssueDate = data.cardIssueDate !== '-' 
    ? formatToMonthYear(data.cardIssueDate)
    : '12/26';
    
  const formattedExpiryDate = data.cardExpiryDate !== '-'
    ? formatToMonthYear(data.cardExpiryDate)
    : '12/27';

  // Preload template
  useEffect(() => {
    const img = new Image();
    const templatePath = side === 'front' 
      ? '/card-templates/resident/ResidentNonMember_front.svg'
      : '/card-templates/resident/ResidentNonMember_back.svg';
    img.src = templatePath;
    img.onload = () => setTemplateLoaded(true);
    img.onerror = () => setImageError(true);
  }, [side]);

  const cardWrapperStyle = {
    width: '86mm',
    height: '54mm',
    position: 'relative' as const,
    backgroundColor: '#fff',
    overflow: 'hidden' as const,
  };

  const textStyle = {
    color: '#e2c172',
    fontFamily: 'Arial, sans-serif',
  };

const getProfileImageSrc = () => {
  // Only use default if there's no profile picture URL or if image failed to load
  if (!data.profilePictureUrl || profileImageError) {
    return '/card-templates/defaultprofilepic.jpg';
  }
  
  // Otherwise use the proxied image URL
  const proxiedUrl = getProxiedImageUrl(data.profilePictureUrl);
  return proxiedUrl || '/card-templates/defaultprofilepic.jpg';
};

  if (!templateLoaded) {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          backgroundColor: '#f0f0f0'
        }}>
          Loading {side} card...
        </div>
      </div>
    );
  }

  if (side === 'front') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {!imageError ? (
          <img 
            src="/card-templates/resident/ResidentNonMember_front.svg" 
            alt="Front Card Template"
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          />
        ) : (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#1a1a2e',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e2c172'
          }}>
            Card Template
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', ...textStyle }}>
          <div style={{ position: 'absolute', top: '29mm', left: '6mm', fontSize: '2.3mm', fontWeight: 100, letterSpacing: '0.4px' }}>
            Card Holder
          </div>
          <div style={{ position: 'absolute', top: '32.5mm', left: '6mm', width: '42mm', fontSize: '3mm', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {data.userName || 'My Name'}
          </div>
          <div style={{ position: 'absolute', top: '40mm', left: '6mm', display: 'flex', gap: '10mm', fontSize: '1.9mm', fontWeight: 100, letterSpacing: '0.2px' }}>
            <span>Card Issue</span>
            <span>Valid Thru</span>
          </div>
          <div style={{ position: 'absolute', top: '43.2mm', left: '6mm', display: 'flex', gap: '12.5mm', fontSize: '3mm', fontWeight: 200 }}>
            <span>{formattedIssueDate}</span>
            <span>{formattedExpiryDate}</span>
          </div>
        </div>
        {/* Profile Photo with default fallback */}
        <img
          src={getProfileImageSrc()}
          alt="User"
          crossOrigin="anonymous"
          onError={() => setProfileImageError(true)}
          style={{
            position: 'absolute',
            right: '5mm',
            top: '27.5mm',
            border: '1px solid #e2c172',
            width: '18mm',
            height: '20mm',
            objectFit: 'cover',
            borderRadius: '2mm',
            zIndex: 2,
          }}
        />
      </div>
    );
  }

  // Back card
  return (
    <div ref={ref} style={cardWrapperStyle}>
      {!imageError ? (
        <img 
          src="/card-templates/resident/ResidentNonMember_back.svg" 
          alt="Back Card Template"
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      ) : (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#1a1a2e',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2c172'
        }}>
          Card Template
        </div>
      )}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DHA_CARD_${data.id || 'TEST'}`}
        alt="QR"
        style={{
          position: 'absolute',
          left: '6.3mm',
          top: '37mm',
          width: '13mm',
          height: '13mm',
          background: '#fff',
          padding: '1mm',
          zIndex: 2,
        }}
      />
      <div style={{ position: 'absolute', top: '5mm', left: '6mm', zIndex: 2, ...textStyle }}>
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ marginBottom: '4mm' }}>
            <div style={{ fontSize: '1.9mm', fontWeight: 100 }}>CNIC No.</div>
            <div style={{ marginTop: '0.8mm', fontSize: '3mm', fontWeight: 200 }}>
              {data.cnic !== '-' ? data.cnic : '42101-1234567-1'}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ marginBottom: '4mm' }}>
            <div style={{ fontSize: '1.9mm', fontWeight: 100, letterSpacing: '0.2px' }}>Card No.</div>
            <div style={{ marginTop: '0.8mm', fontSize: '3mm', fontWeight: 200 }}>{data.hierarchicalId || '-'}</div>
          </div>
        </div>
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ width: '60mm' }}>
            <div style={{ fontSize: '1.9mm', fontWeight: 100, letterSpacing: '0.2px' }}>Address</div>
            <div style={{ marginTop: '0.8mm', fontSize: '3mm', fontWeight: 200, lineHeight: '3.3mm' }}>
              {data.address !== '-' ? data.address : 'Plot no. 1234, Khayaban e Iqbal Zone B, DHA Karachi'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}