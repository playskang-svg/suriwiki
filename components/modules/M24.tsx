import { ModuleProps } from "@/lib/schemas/modules";
import { CTA_ROTATIONS } from "@/config/cta";
import { siteConfig } from "@/config/site";

export default function M24({ body }: ModuleProps<"M24">) {
  const rotationIndex = Array.from(body.rotation_key).reduce((acc, char) => acc + char.charCodeAt(0), 0) % CTA_ROTATIONS.length;
  const headline = CTA_ROTATIONS[rotationIndex] || body.headline;

  return (
    <div className="mb-stack-md bg-primary-container text-on-primary rounded-xl p-stack-lg shadow-lg text-center flex flex-col items-center">
      <h2 className="font-headline-md text-[24px] md:text-[32px] mb-6 max-w-2xl leading-tight">
        {headline}
      </h2>
      
      <div className="w-full max-w-md flex flex-col gap-4">
        <a 
          href={body.primary.type === 'tel' ? `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, '')}` : '/consult'}
          className="bg-primary text-on-primary w-full py-4 rounded-lg font-headline-md text-[18px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
        >
          {body.primary.type === 'photo_upload' && <span className="material-symbols-outlined" aria-hidden="true">add_a_photo</span>}
          {body.primary.type === 'tel' && <span className="material-symbols-outlined" aria-hidden="true">call</span>}
          {body.primary.label || '상담하기'}
        </a>

        {body.secondary.length > 0 && (
          <div className="flex justify-center gap-4 mt-2">
            {body.secondary.map((sec, idx) => (
              <a 
                key={idx} 
                href={sec.type === 'tel' ? `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, '')}` : siteConfig.contact.kakao_url || '#'} 
                target={sec.type === 'chat' ? '_blank' : undefined}
                rel={sec.type === 'chat' ? 'noopener noreferrer' : undefined}
                className="font-status-label text-[14px] flex items-center gap-1 text-primary-fixed-dim hover:text-white transition-colors"
              >
                {sec.type === 'tel' && <span className="material-symbols-outlined text-[16px]" aria-hidden="true">call</span>}
                {sec.type === 'chat' && <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chat</span>}
                {sec.label || (sec.type === 'tel' ? '전화상담' : '채팅상담')}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
