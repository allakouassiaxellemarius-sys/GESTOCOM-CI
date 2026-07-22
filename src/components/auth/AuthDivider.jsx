export default function AuthDivider({ label = 'ou' }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
    </div>
  )
}
