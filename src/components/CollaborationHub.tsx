import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Users, Clock, CheckCircle, AlertCircle, Send, Share, Eye, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useValuationCollaboration } from "@/hooks/useValuationCollaboration";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "react-router-dom";

const CollaborationHub = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: valuationId } = useParams();
  const { comments, tasks, loading, addComment, addTask, updateTaskStatus } = useValuationCollaboration(valuationId, user?.id);
  const [newComment, setNewComment] = useState("");
  const [selectedSection, setSelectedSection] = useState("general");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    await addComment(newComment, selectedSection);
    setNewComment("");
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    await updateTaskStatus(taskId, newStatus);
  };

  // Mock data temporal para permisos de compartir (será implementado en Fase 2)
  const sharePermissions: any[] = [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      "completed": "default",
      "in-progress": "secondary", 
      "pending": "outline"
    };
    return variants[status] || "outline";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Colaboración</h1>
          <p className="text-muted-foreground">
            Trabajo en equipo y gestión de workflows
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            <MessageSquare className="h-3 w-3 mr-1" />
            {comments.length} comentarios
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="comments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="sharing">Compartir</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Comentarios y Discusiones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new comment */}
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Añadir un comentario o pregunta..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sección relacionada" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="dcf">Valoración DCF</SelectItem>
                        <SelectItem value="multiples">Múltiplos</SelectItem>
                        <SelectItem value="risks">Análisis de Riesgo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddComment}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments list */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay comentarios aún. Sé el primero en comentar.
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.author_id.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">Usuario</span>
                            {comment.section && (
                              <Badge variant="outline" className="text-xs">
                                {comment.section}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team sidebar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Tareas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{task.title}</span>
                      <Badge variant={getStatusBadge(task.status)} className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No hay tareas pendientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tareas del Proyecto</CardTitle>
              <CardDescription>
                Gestión de tareas y estados del workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay tareas creadas aún.
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.due_date && `Vence: ${new Date(task.due_date).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <Badge variant={getStatusBadge(task.status)}>
                          {task.status}
                        </Badge>
                        <Select 
                          value={task.status} 
                          onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in-progress">En Progreso</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
              <CardDescription>
                Registro cronológico de todas las modificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  El historial de cambios estará disponible próximamente
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Permisos de Acceso</CardTitle>
                <CardDescription>
                  Gestiona quién puede ver y editar la valoración
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sharePermissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se ha compartido con nadie aún
                  </div>
                ) : (
                  sharePermissions.map(permission => (
                    <div key={permission.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{permission.user}</p>
                        <p className="text-sm text-muted-foreground">
                          Compartido el {permission.sharedDate}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {permission.permission === 'edit' ? 
                          <Edit className="h-4 w-4 text-green-500" /> : 
                          <Eye className="h-4 w-4 text-blue-500" />
                        }
                        <Badge variant={permission.permission === 'edit' ? 'default' : 'secondary'}>
                          {permission.permission === 'edit' ? 'Editar' : 'Ver'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compartir Nuevo Acceso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input placeholder="email@ejemplo.com" />
                </div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar permisos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Solo lectura</SelectItem>
                    <SelectItem value="comment">Puede comentar</SelectItem>
                    <SelectItem value="edit">Puede editar</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full">
                  <Share className="h-4 w-4 mr-2" />
                  Enviar Invitación
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaborationHub;