import Link from "next/link";

export const metadata = { title: "이용약관 — Piped" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">← 홈으로</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">이용약관</h1>
      <p className="mt-2 text-sm text-gray-500">최종 수정일: 2026년 3월 29일</p>

      <div className="mt-8 space-y-8 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">제1조 (목적)</h2>
          <p className="mt-2">
            본 약관은 Piped(이하 &quot;서비스&quot;)가 제공하는 마케팅 자동화 서비스의 이용 조건 및 절차,
            이용자와 서비스 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">제2조 (용어의 정의)</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>&quot;이용자&quot;</strong>: 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
            <li><strong>&quot;크레딧&quot;</strong>: 서비스 내 기능(사이트 분석, 카피 생성, 이미지 생성 등)을 이용하기 위해 구매하는 디지털 재화를 말합니다.</li>
            <li><strong>&quot;메이커&quot;</strong>: 제품을 보유하고 마케팅 자동화를 이용하는 이용자를 말합니다.</li>
            <li><strong>&quot;인플루언서&quot;</strong>: 제휴 프로그램에 참여하여 제품을 홍보하고 커미션을 수령하는 이용자를 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">제3조 (서비스의 내용)</h2>
          <p className="mt-2">서비스는 다음의 기능을 제공합니다:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>AI 기반 웹사이트 분석 및 마케팅 카피 생성</li>
            <li>광고 크리에이티브(이미지/영상) 자동 생성</li>
            <li>Meta Ads, Google Ads 캠페인 생성 및 관리</li>
            <li>인플루언서 제휴 프로그램 생성, 레퍼럴 추적, 커미션 정산</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">제4조 (크레딧 구매 및 이용)</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>크레딧은 카드 결제 또는 크립토(USDT/USDC) 결제를 통해 구매할 수 있습니다.</li>
            <li>크립토 결제 시 카드 결제 대비 5% 할인이 적용됩니다.</li>
            <li>구매한 크레딧은 즉시 충전되며, 서비스 내 기능 이용 시 차감됩니다.</li>
            <li>크레딧의 유효기간은 구매일로부터 1년입니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">제5조 (환불 정책)</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>크레딧은 디지털 상품으로, 구매 후 사용하지 않은 크레딧에 한하여 구매일로부터 7일 이내 환불을 요청할 수 있습니다.</li>
            <li>이미 사용(차감)된 크레딧은 환불 대상에서 제외됩니다.</li>
            <li>환불은 원래 결제 수단으로 처리되며, 크립토 결제의 경우 동일 지갑 주소로 반환됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">제6조 (제휴 프로그램)</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>메이커는 인플루언서 마케팅을 위한 제휴 프로그램을 생성하고 커미션 조건을 설정할 수 있습니다.</li>
            <li>인플루언서는 제휴 프로그램에 참여하고 레퍼럴 링크를 통해 전환을 발생시켜 커미션을 수령합니다.</li>
            <li>커미션은 레퍼럴 쿠키 유효 기간 내의 전환에 대해서만 인정됩니다.</li>
            <li>부정한 방법(자기 클릭, 봇 트래픽 등)으로 발생한 전환은 커미션 지급이 거부될 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">제7조 (면책 사항)</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>AI가 생성한 콘텐츠(카피, 이미지, 영상)의 정확성, 적합성을 보증하지 않으며, 이용자가 최종 확인 후 사용해야 합니다.</li>
            <li>광고 플랫폼(Meta, Google)의 정책 변경으로 인한 캠페인 거부 또는 계정 제한에 대해 서비스는 책임지지 않습니다.</li>
            <li>서비스는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">제8조 (약관의 변경)</h2>
          <p className="mt-2">
            서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지 후 즉시 효력이 발생합니다.
            이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
          </p>
        </section>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>본 약관에 관한 문의: support@piped.app</p>
        </div>
      </div>
    </div>
  );
}
