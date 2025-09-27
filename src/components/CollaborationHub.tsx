import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Users, Clock, CheckCircle, AlertCircle, Send, Share, Eye, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CollaborationHub = () => {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [selectedTask, setSelectedTask] = useState("");

  const teamMembers = [
    {
      id: "1",
      name: "Ana García",
      role: "Senior Analyst",
      avatar: "/api/placeholder/32/32",
      status: "online",
      initials: "AG"
    },
    {
      id: "2", 
      name: "Carlos Ruiz",
      role: "Director",
      avatar: "/api/placeholder/32/32",
      status: "busy",
      initials: "CR"
    },
    {
      id: "3",
      name: "María López",
      role: "Junior Analyst", 
      avatar: "/api/placeholder/32/32",
      status: "offline",
      initials: "ML"
    }
  ];

  const comments = [
    {
      id: "1",
      author: "Ana García",
      avatar: "/api/placeholder/32/32",
      initials: "AG",
      content: "He revisado los múltiplos del sector y creo que deberíamos ajustar el rango a 3.8x - 4.5x basado en las últimas transacciones.",
      timestamp: "hace 2 horas",
      section: "Múltiplos Comparables",
      type: "suggestion"
    },
    {
      id: "2",
      author: "Carlos Ruiz", 
      avatar: "/api/placeholder/32/32",
      initials: "CR",
      content: "Aprobado. También necesitamos validar los datos de crecimiento proyectado con el cliente antes de finalizar.",
      timestamp: "hace 1 hora",
      section: "Valoración DCF",
      type: "approval"
    },
    {
      id: "3",
      author: "María López",
      avatar: "/api/placeholder/32/32", 
      initials: "ML",
      content: "¿Deberíamos incluir un análisis de sensibilidad adicional para las tasas de descuento?",
      timestamp: "hace 30 min",
      section: "Análisis de Riesgo",
      type: "question"
    }
  ];

  const workflowTasks = [
    {
      id: "1",
      title: "Revisión de Datos Financieros",
      assignee: "Ana García",
      status: "completed",
      dueDate: "2024-01-15",
      priority: "high"
    },
    {
      id: "2",
      title: "Validación de Múltiplos",
      assignee: "Carlos Ruiz",
      status: "in-progress", 
      dueDate: "2024-01-16",
      priority: "medium"
    },
    {
      id: "3",
      title: "Preparación de Presentación",
      assignee: "María López",
      status: "pending",
      dueDate: "2024-01-18",
      priority: "low"
    },
    {
      id: "4",
      title: "Revisión Final y Aprobación",
      assignee: "Carlos Ruiz",
      status: "pending",
      dueDate: "2024-01-20",
      priority: "high"
    }
  ];

  const changeHistory = [
    {
      id: "1",
      user: "Ana García",
      action: "Actualizó múltiplo EBITDA",
      details: "Cambió de 4.0x a 4.2x",
      timestamp: "2024-01-15 14:30",
      section: "Múltiplos"
    },
    {
      id: "2",
      user: "Carlos Ruiz",
      action: "Aprobó valoración DCF",
      details: "Valoración de €1.68M aprobada",
      timestamp: "2024-01-15 13:15",
      section: "DCF"
    },
    {
      id: "3",
      user: "María López",
      action: "Añadió comentario",
      details: "Pregunta sobre análisis de sensibilidad",
      timestamp: "2024-01-15 12:45",
      section: "Riesgos"
    }
  ];

  const sharePermissions = [
    {
      id: "1",
      user: "cliente@empresa.com",
      permission: "view",
      sharedDate: "2024-01-14"
    },
    {
      id: "2", 
      user: "socio@despacho.com",
      permission: "edit",
      sharedDate: "2024-01-13"
    }
  ];

  const addComment = () => {
    if (!newComment.trim()) return;
    
    toast({
      title: "Comentario añadido",
      description: "Tu comentario ha sido añadido exitosamente.",
    });
    
    setNewComment("");
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    toast({
      title: "Estado actualizado",
      description: `La tarea ha sido marcada como ${newStatus}.`,
    });
  };

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
            <Users className="h-3 w-3 mr-1" />
            {teamMembers.length} colaboradores
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
                    <Select>
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
                    <Button onClick={addComment}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments list */}
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <Badge variant="outline" className="text-xs">
                            {comment.section}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team sidebar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Equipo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.initials}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          member.status === 'online' ? 'bg-green-500' :
                          member.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
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
                {workflowTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Asignado a: {task.assignee} • Vence: {task.dueDate}
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
                        onValueChange={(value) => updateTaskStatus(task.id, value)}
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
                ))}
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
                {changeHistory.map(change => (
                  <div key={change.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                    <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{change.user}</span>
                        <span className="text-sm text-muted-foreground">{change.action}</span>
                        <Badge variant="outline" className="text-xs">{change.section}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{change.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{change.timestamp}</p>
                    </div>
                  </div>
                ))}
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
                {sharePermissions.map(permission => (
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
                ))}
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