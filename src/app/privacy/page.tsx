import Link from "next/link";

export const metadata = { title: "개인정보처리방침 — MaktMakr" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">← 홈으로</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-gray-500">최종 수정일: 2026년 3월 29일</p>

      <div className="mt-8 space-y-8 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. 수집하는 개인정보</h2>
          <p className="mt-2">서비스는 다음의 개인정보를 수집합니다:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>회원가입 시:</strong> 이메일, 이름(표시명), 비밀번호(암호화 저장)</li>
            <li><strong>Google 로그인 시:</strong> 이메일, 이름, 프로필 사진 URL</li>
            <li><strong>결제 시:</strong> 결제 수단 정보(Stripe에서 처리, 서비스는 카드 번호를 직접 저장하지 않음), 크립토 지갑 주소</li>
            <li><strong>서비스 이용 시:</strong> 프로젝트 URL, 생성된 카피/크리에이티브, 캠페인 설정 정보</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. 개인정보의 이용 목적</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>서비스 제공 및 운영 (AI 분석, 콘텐츠 생성, 캠페인 관리)</li>
            <li>결제 처리 및 크레딧 관리</li>
            <li>제휴 프로그램 운영 (레퍼럴 추적, 커미션 정산)</li>
            <li>서비스 개선 및 통계 분석 (비식별 처리)</li>
            <li>고객 지원 및 공지사항 전달</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. 개인정보의 보관 및 파기</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>회원 탈퇴 시 개인정보는 즉시 파기합니다. 단, 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관합니다.</li>
            <li>결제 기록: 전자상거래법에 따라 5년 보관</li>
            <li>접속 기록: 통신비밀보호법에 따라 3개월 보관</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. 개인정보의 제3자 제공</h2>
          <p className="mt-2">서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>법령에 의한 요청이 있는 경우</li>
            <li>결제 처리를 위해 결제 대행사(Stripe, Banksi)에 필요한 최소한의 정보를 전달하는 경우</li>
            <li>광고 캠페인 집행을 위해 광고 플랫폼(Meta, Google)에 타겟팅 정보를 전달하는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. 쿠키 및 추적 기술</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>인증 쿠키:</strong> 로그인 상태 유지를 위해 사용됩니다.</li>
            <li><strong>레퍼럴 쿠키 (piped_ref):</strong> 제휴 프로그램의 전환 추적을 위해 사용되며, 프로그램별 설정된 기간 후 만료됩니다.</li>
            <li>이용자는 브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. 이용자의 권리</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다.</li>
            <li>회원 탈퇴를 통해 개인정보 처리 정지를 요청할 수 있습니다.</li>
            <li>개인정보 관련 문의는 아래 연락처로 요청할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">7. 개인정보 보호 조치</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>비밀번호는 단방향 암호화하여 저장합니다.</li>
            <li>모든 통신은 SSL/TLS로 암호화됩니다.</li>
            <li>결제 정보는 PCI-DSS 인증을 받은 Stripe에서 처리하며, 서비스는 카드 정보를 직접 저장하지 않습니다.</li>
            <li>Firebase 보안 규칙을 통해 데이터 접근을 제어합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">8. 방침의 변경</h2>
          <p className="mt-2">
            본 방침은 관련 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지를 통해 안내합니다.
          </p>
        </section>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>개인정보 관련 문의: privacy@maktmakr.com</p>
        </div>
      </div>
    </div>
  );
}
