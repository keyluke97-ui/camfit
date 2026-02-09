import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { MOCK_ANALYSIS } from "@/lib/mockData";

export function PhotoGallery() {
    const photos = MOCK_ANALYSIS.photos;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                🏆 AI 추천 베스트 컷
                <Badge variant="success">TOP 3</Badge>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {photos.map((photo, index) => (
                    <GlassCard key={photo.id} className="p-0 overflow-hidden group relative border-0 ring-1 ring-white/20" hoverEffect>
                        <div className="aspect-[4/5] md:aspect-square relative flex items-center justify-center bg-gray-100 overflow-hidden">
                            {/* Image Placeholder if URL fails or for demo */}
                            <img
                                src={photo.url}
                                alt={`Rank ${photo.rank}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Rank Badge */}
                            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-camfit-green text-camfit-dark flex items-center justify-center font-bold shadow-lg z-10">
                                {photo.rank}
                            </div>

                            {/* Overlay Info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <p className="text-white font-medium text-sm mb-1">{photo.reason}</p>
                                <div className="flex gap-1 flex-wrap">
                                    {photo.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
