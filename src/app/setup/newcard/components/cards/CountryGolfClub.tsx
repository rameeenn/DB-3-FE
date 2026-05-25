'use client';

import { useRef, useEffect, useState } from 'react';
import { CardData, CardComponentProps } from './types';

interface CountryGolfClubCardProps extends CardComponentProps {
  side: 'front' | 'back';
}

export default function CountryGolfClubCard({ data, side, cardRef, isDownload = false }: CountryGolfClubCardProps) {
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
      ? '/card-templates/clubs/CountryGolf_front.svg'
      : '/card-templates/clubs/CountryGolf_back.svg';
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
    color: '#e9cb86',
    fontFamily: 'Arial, sans-serif',
  };

  // Get the profile image source (with fallback to default)
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
          Loading Country and Gold Club {side} card...
        </div>
      </div>
    );
  }

  if (side === 'front') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {!imageError ? (
          <img 
            src="/card-templates/clubs/CountryGolf_front.svg" 
            alt="Country and Golf Club Front Card Template"
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
            Creek Club Card Template
          </div>
        )}
        
        {/* Profile Image - centered or positioned as per design */}
        <img
          src={getProxiedImageUrl(data.profilePictureUrl) || '/card-templates/defaultprofilepic.jpg'}
          alt="Member"
          crossOrigin="anonymous"
          onError={() => setProfileImageError(true)}
          style={{
            position: 'absolute',
            left: '71mm',    // X position from left edge
            top: '35mm',     // Y position from top edge
            transform: 'translate(-50%, -50%)',
            width: '18mm',
            height: '20mm',
            objectFit: 'cover',
            borderRadius: '2mm',
            border: '1px solid #e2c172',
            zIndex: 2,
          }}
        />

        {/* Username at bottom right */}
        <div style={{ 
          position: 'absolute', 
          bottom: '5mm', 
          right: '6mm', 
          zIndex: 2, 
          ...textStyle,
          textAlign: 'right',
          fontSize: '2.5mm',
          fontWeight: 500,
          maxWidth: '50mm',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}>
          {data.userName || 'Member Name'}
        </div>
      </div>
    );
  }

  // Back card
  return (
    <div ref={ref} style={cardWrapperStyle}>
      {!imageError ? (
        <img 
          src="/card-templates/clubs/CountryGolf_back.svg" 
          alt="Country and Golf Club Back Card Template"
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
          Country and Golf Club Card Template
        </div>
      )}
      
      {/* Back side information */}
      <div style={{ position: 'absolute', top: '5mm', left: '7.1mm', zIndex: 2, ...textStyle, width: '60mm' }}>
        {/* Row 1: CNIC and Card No in one row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '3mm',
          gap: '0mm'
        }}>
          {/* CNIC */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.6mm', fontWeight: 100, marginBottom: '1mm' }}>
              CNIC No.
            </div>
            <div style={{ fontSize: '2.5mm', fontWeight: 200 }}>
              {data.cnic !== '-' ? data.cnic : '42101-1234567-1'}
            </div>
          </div>
          
          {/* Card No */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.6mm', fontWeight: 100, marginBottom: '1mm' }}>
              Card No.
            </div>
            <div style={{ fontSize: '2.5mm', fontWeight: 200 }}>
              {data.hierarchicalId || '-'}
            </div>
          </div>
        </div>

        {/* Row 2: Club Membership No, Card Issue, Valid Thru in one row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '3mm',
          gap: '0mm'
        }}>
          {/* Club Membership No */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.6mm', fontWeight: 100, marginBottom: '1mm' }}>
              Club Membership No.
            </div>
            <div style={{ fontSize: '2.5mm', fontWeight: 200 }}>
              {data.memberNo || '-'}
            </div>
          </div>
          
          {/* Card Issue */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.6mm', fontWeight: 100, marginBottom: '1mm', marginLeft: '10.5mm' }}>
              Card Issue
            </div>
            <div style={{ fontSize: '2.5mm', fontWeight: 200, marginLeft: '10.5mm' }}>
              {formattedIssueDate}
            </div>
          </div>
          
          {/* Valid Thru */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.6mm', fontWeight: 100, marginBottom: '1mm', marginLeft: '2mm' }}>
              Valid Thru
            </div>
            <div style={{ fontSize: '2.5mm', fontWeight: 200, marginLeft: '2mm' }}>
              {formattedExpiryDate}
            </div>
          </div>
        </div>

        {/* Row 3: Status (User Type) */}
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ fontSize: '1.6mm', fontWeight: 100, marginBottom: '1mm' }}>
            Status
          </div>
          <div style={{ fontSize: '2.5mm', fontWeight: 200 }}>
            {data.userType !== '-' ? data.userType : 'Member'}
          </div>
        </div>

        {/* Row 4: Address */}
        <div style={{ marginBottom: '3mm' }}>
          <div style={{ fontSize: '1.6mm', fontWeight: 100, marginBottom: '1mm' }}>
            Address
          </div>
          <div style={{ fontSize: '2.5mm', fontWeight: 200, lineHeight: '2.8mm' }}>
            {data.address !== '-' ? data.address : 'DHA Karachi, Pakistan'}
          </div>
        </div>
      </div>

      {/* QR Code at bottom right */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CLUB_CARD_${data.id || 'TEST'}`}
        alt="QR"
        style={{
          position: 'absolute',
          right: '6mm',
          bottom: '6mm',
          width: '12mm',
          height: '12mm',
          background: '#fff',
          padding: '1mm',
          zIndex: 2,
        }}
      />
    </div>
  );
}