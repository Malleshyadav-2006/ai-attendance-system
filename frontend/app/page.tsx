
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col mb-12">
        <h1 className="text-5xl font-extrabold text-center mb-4 text-indigo-900 tracking-tight">
          Student Portal
        </h1>
        <p className="text-gray-600 text-lg">AI-Powered Attendance System</p>
      </div>

      <div className="grid text-center lg:max-w-4xl lg:w-full lg:grid-cols-2 gap-8 mb-16">
        <Link
          href="/student"
          className="group relative flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-white p-10 shadow-xl transition-all hover:shadow-2xl hover:scale-105 hover:border-indigo-300"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-3xl">
            🎓
          </div>
          <h2 className="mb-3 text-2xl font-bold text-indigo-700">
            Student Login
          </h2>
          <p className="max-w-[30ch] text-sm text-gray-500">
            Access your profile and attendance history using Face ID.
          </p>
        </Link>

        <Link
          href="/register"
          className="group relative flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-10 shadow-xl transition-all hover:shadow-2xl hover:scale-105 hover:border-blue-300"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-3xl">
            📝
          </div>
          <h2 className="mb-3 text-2xl font-bold text-blue-700">
            New Registration
          </h2>
          <p className="max-w-[30ch] text-sm text-gray-500">
            First time here? Register your face to get started.
          </p>
        </Link>
      </div>

      <Link
        href="/admin"
        className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-2 transition-colors"
      >
        <span>🔐</span> Admin Dashboard
      </Link>
    </main>
  );
}
