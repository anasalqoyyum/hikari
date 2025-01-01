import { ErrorPageNavButtons } from '@/components/error-page-nav-buttons'
import { XCircleIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <main className="flex flex-col w-full h-full justify-center items-center gap-4 text-center">
      <XCircleIcon className="w-48 mb-10" />
      <header className="text-2xl font-semibold mb-5">
        The link you requested could not be found.
      </header>
      <section className="flex gap-2">
        <ErrorPageNavButtons />
      </section>
    </main>
  )
}
