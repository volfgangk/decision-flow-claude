// =========================================================================
// 1. [MOCK DATA] — 참고용 테스트 안건 (로컬 전용, 서버 미전송)
// =========================================================================

const INITIAL_MOCK_DATA = [
  {
    id: 'MOCK_WORKSHOP',
    isMock: true,
    max_members: 2,
    title: '📋 [참고용 테스트 안건] 2026 하반기 팀 워크숍 장소 정하기',
    status: '진행중',
    dDay: 'D-2',
    voters: 0,
    options: [
      { id: '1',     text: '제주도 (푸른 바다와 맛있는 해산물이 가득한 섬)',    voteCount: 0 },
      { id: '1-1',   text: '함덕 해변 근처 (최고의 힐링 장소)',                voteCount: 0 },
      { id: '1-1-1', text: '서우봉 둘레길 오후 산책 코스 탐방',                voteCount: 0 },
      { id: '1-1-2', text: '해변 앞 유명 카페 델문도 단체 방문',               voteCount: 0 },
      { id: '1-2',   text: '서귀포 숲속 산장 (깊은 대화 가능)',                voteCount: 0 },
      { id: '1-2-1', text: '산장 야외 바베큐 파티 및 불멍 캠핑',               voteCount: 0 },
      { id: '1-2-2', text: '아침 편백나무 숲길 피톤치드 명상',                 voteCount: 0 },
      { id: '2',     text: '강릉/속초 (시원한 파도와 커피 거리가 있는 동해안)', voteCount: 0 },
      { id: '2-1',   text: '안목해변 커피거리 정복 코스',                      voteCount: 0 },
      { id: '2-1-1', text: '로컬 유명 로스팅 카페 바리스타 체험',              voteCount: 0 },
      { id: '2-1-2', text: '해변 오션뷰 테라스 브런치 타임',                   voteCount: 0 },
      { id: '2-2',   text: '설악산 조용한 힐링 펜션 단지',                     voteCount: 0 },
      { id: '2-2-1', text: '흔들바위 가벼운 오전 등산 코스',                   voteCount: 0 },
      { id: '2-2-2', text: '계곡 토종닭 백숙 몸보신 만찬',                     voteCount: 0 },
    ],
    voteLogs: [],
    earlyCloseRate: 50,
  },
];

export default INITIAL_MOCK_DATA;