import type { FileGroup } from 'renderer/routes/main/configuration/helpers';
import { Image, FileText, Map, LucideIcon, Book, Video } from 'lucide-react';
import { useUnit } from 'effector-react';
import { $$theme } from 'renderer/entities/theme/model';

type GroupIconProps = {
    group: FileGroup;
};

const icons = {
    images: Image,
    documents: FileText,
    geospatial: Map,
    books: Book,
    videos: Video,
} satisfies Record<FileGroup, LucideIcon>;

export function GroupIcon({ group }: GroupIconProps) {
    const theme = useUnit($$theme.$theme);

    const Icon = icons[group];

    return (
        <div className="relative size-12 shrink-0">
            <div className="flex size-full items-center justify-center rounded-[8.75px] bg-white">
                <Icon
                    className="size-8"
                    style={{
                        color: theme === 'light' ? '#7F68C7' : '#020111',
                    }}
                />
            </div>
        </div>
    );
}
