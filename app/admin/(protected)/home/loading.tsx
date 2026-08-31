export default function AdminHomeLoading() {
  return <div className="homeManager" aria-busy="true" aria-live="polite"><div className="homeManagerSkeletonTitle" /><div className="homeManagerInfo">Carregando a estrutura atual da Home…</div><div className="homeManagerList">{Array.from({ length: 8 }, (_, index) => <div className="homeSectionCard homeSectionSkeleton" key={index}><span className="homeSectionPosition">{index + 1}</span><div className="homeManagerPreview" /><div className="homeSectionContent"><i /><i /><i /></div></div>)}</div></div>;
}
