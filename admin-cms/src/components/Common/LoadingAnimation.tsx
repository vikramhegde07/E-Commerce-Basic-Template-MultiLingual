import { useLoading } from '@/context/LoadingContext'

function LoadingAnimation() {
    const { isLoading } = useLoading();
    if (!isLoading)
        return null;

    return (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-49">
            <div className="flex-col gap-4 w-full flex items-center justify-center relative z-50">
                <div
                    className="w-32 h-32 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full"
                >
                    <div
                        className="w-26 h-26 border-4 border-transparent text-red-400 text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full"
                    ></div>

                </div>
            </div>
        </div>
    )
}

export default LoadingAnimation
