import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="mx-auto w-full max-w-md bg-white p-4 rounded text-black">
        <p>Simulate liftoff by controlling real-time rocket physics. Adjust thrust, initial mass, and gravity to see how your rocket behaves. Experiment with different configurations, manage fuel, and watch the rocket climb (or fail) based on your inputs. Simple controls, realistic physics, and limitless fun in exploring how rockets actually launch.</p>
        <Link href="/liftoff" className="block">
          <div className="mx-auto w-full max-w-md bg-red-200 p-4 rounded-lg text-center cursor-pointer hover:bg-red-300">
            Go to Liftoff!!
          </div>
        </Link>
      </div>
    </div>
  );
}
