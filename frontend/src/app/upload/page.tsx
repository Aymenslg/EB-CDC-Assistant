import UploadForm from "@/components/upload/UploadForm";

export default function UploadPage() {
    return (
        <div className="p-6 lg:p-7">
            <div className="mb-4.5">
                <h1 className="text-[17px] font-medium text-foreground mb-0.5">Import EB</h1>
                <p className="text-xs text-text-secondary">
                    Déposez une expression de besoin pour générer automatiquement le cahier des charges
                </p>
            </div>
            <UploadForm />
        </div>
    );
}