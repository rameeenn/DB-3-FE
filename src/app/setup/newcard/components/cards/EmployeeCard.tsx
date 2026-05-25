// components/cards/EmployeeCard.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { CardData, CardComponentProps } from './types';

interface EmployeeCardProps extends CardComponentProps {
  side: 'front' | 'back';
}

export default function EmployeeCard({ data, side, cardRef, isDownload = false }: EmployeeCardProps) {
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
      ? '/card-templates/employee/Employee_front.svg'
      : '/card-templates/employee/Employee_back.svg';
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
          Loading Employee {side} card...
        </div>
      </div>
    );
  }

  if (side === 'front') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {!imageError ? (
          <img 
            src="/card-templates/employee/Employee_front.svg" 
            alt="Employee Front Card Template"
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
            Employee Card Template
          </div>
        )}
        
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', ...textStyle }}>
          {/* Employee Name */}
          <div style={{ 
            position: 'absolute', 
            top: '30mm', 
            left: '6mm', 
            width: '42mm', 
            fontSize: '3mm', 
            fontWeight: 500, 
            overflow: 'hidden', 
            whiteSpace: 'nowrap', 
            textOverflow: 'ellipsis' 
          }}>
            {data.userName || 'Employee Name'}
          </div>

          {/* Three Column Layout for DHA Staff, Card Issue, Valid Thru */}
          <div style={{ 
            position: 'absolute', 
            top: '40mm', 
            left: '6mm',
            display: 'flex',
            gap: '4mm',
            width: '50mm'
          }}>
            {/* Column 1: DHA Staff */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3mm' }}>
              <div style={{ fontSize: '1.6mm', fontWeight: 100, letterSpacing: '0.2px' }}>
                DHA Staff
              </div>
              <div style={{ fontSize: '2.5mm', fontWeight: 200 }}>
                {data.staffNo || data.id?.slice(0, 10) || '12345'}
              </div>
            </div>

            {/* Column 2: Card Issue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3mm' }}>
              <div style={{ fontSize: '1.6mm', fontWeight: 100, letterSpacing: '0.2px' }}>
                Card Issue
              </div>
              <div style={{ fontSize: '2.5mm', fontWeight: 200 }}>
                {formattedIssueDate}
              </div>
            </div>

            {/* Column 3: Valid Thru */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3mm' }}>
              <div style={{ fontSize: '1.6mm', fontWeight: 100, letterSpacing: '0.2px' }}>
                Valid Thru
              </div>
              <div style={{ fontSize: '2.5mm', fontWeight: 200 }}>
                {formattedExpiryDate}
              </div>
            </div>
          </div>
        </div>

        {/* Employee Photo with default fallback */}
        <img
          src={getProxiedImageUrl(data.profilePictureUrl) || '/card-templates/defaultprofilepic.jpg'}
          alt="Employee"
          crossOrigin="anonymous"
          onError={() => setProfileImageError(true)}
          style={{
            position: 'absolute',
            right: '5mm',
            top: '27mm',
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

  // Back card - Only CNIC, Card No., and Address
  return (
    <div ref={ref} style={cardWrapperStyle}>
      {!imageError ? (
        <img 
          src="/card-templates/employee/Employee_back.svg" 
          alt="Employee Back Card Template"
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
          Employee Card Template
        </div>
      )}
      
      {/* QR Code */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=EMP_CARD_${data.id || 'TEST'}`}
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
      
      {/* Back side information - Only CNIC, Card No., Address */}
      <div style={{ position: 'absolute', top: '5mm', left: '6mm', zIndex: 2, ...textStyle }}>
        {/* CNIC */}
        <div style={{ marginBottom: '4mm' }}>
          <div style={{ marginBottom: '2mm' }}>
            <div style={{ fontSize: '1.9mm', fontWeight: 100 }}>CNIC No.</div>
            <div style={{ marginTop: '0.8mm', fontSize: '2.8mm', fontWeight: 200 }}>
              {data.cnic !== '-' ? data.cnic : '-'}
            </div>
          </div>
        </div>

        {/* Card Number */}
        <div style={{ marginBottom: '4mm' }}>
          <div style={{ marginBottom: '2mm' }}>
            <div style={{ fontSize: '1.9mm', fontWeight: 100, letterSpacing: '0.2px' }}>
              Card No.
            </div>
            <div style={{ marginTop: '0.8mm', fontSize: '2.8mm', fontWeight: 200 }}>
              {data.hierarchicalId || '-'}
            </div>
          </div>
        </div>

        {/* Address */}
        <div style={{ marginBottom: '4mm' }}>
          <div style={{ width: '60mm' }}>
            <div style={{ fontSize: '1.9mm', fontWeight: 100, letterSpacing: '0.2px' }}>Address</div>
            <div style={{ marginTop: '0.8mm', fontSize: '2.5mm', fontWeight: 200, lineHeight: '3.3mm' }}>
              {data.address !== '-' ? data.address : 'DHA Karachi, Pakistan'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}