import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function VirtualProfessor() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Virtual Professor</h1>
                    <p className="text-muted-foreground">Interactive virtual learning assistant</p>
                </div>

                <Card className="h-full min-h-[700px]">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Virtual Classroom
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-full p-0 overflow-hidden rounded-b-lg">
                        <iframe
                            src="https://bey.chat/acb70957-df3d-4c39-830f-f9054bae7189"
                            width="100%"
                            height="700px"
                            frameBorder="0"
                            allowFullScreen
                            allow="camera; microphone; fullscreen"
                            style={{ border: "none", maxWidth: "100%", height: "700px" }}
                            title="Virtual Professor"
                        ></iframe>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
