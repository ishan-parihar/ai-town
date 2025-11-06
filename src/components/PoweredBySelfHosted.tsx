export default function PoweredBySelfHosted() {
  return (
    <div
      className="group absolute top-0 left-0 w-64 h-64 md:block z-10 hidden shape-top-left-corner overflow-hidden"
      aria-label="AI Council LifeOS - Self-Hosted"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-80 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="absolute inset-0 flex p-6">
        <div className="flex flex-col gap-1 items-center text-white">
          <span className="font-system font-medium uppercase tracking-wider text-white/80">
            Powered by
          </span>
          <div className="text-xl font-bold text-center">
            AI Council<br/>LifeOS
          </div>
          <div className="text-xs text-white/60 text-center">
            Self-Hosted<br/>Open Source
          </div>
        </div>
      </div>
    </div>
  );
}