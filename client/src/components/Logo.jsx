export default function Logo({ size = 45, showText = true }) {
  return (
    <div className="relative inline-block">
      <img
        src="/Khudalagse.svg"
        alt="KhudaLagse"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <span 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-violet-500 whitespace-nowrap"
          style={{
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
          }}
        >
          Khudalagse
        </span>
      )}
    </div>
  );
}