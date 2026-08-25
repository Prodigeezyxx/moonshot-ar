import { NODES, EDGES, type GraphNode, type GraphEdge } from '../data/graph'

export interface RouteStep {
  fromNode: GraphNode
  toNode: GraphNode
  instruction: string
  distanceMeters: number
}

export interface RouteResult {
  pathNodes: GraphNode[]
  steps: RouteStep[]
  totalDistanceMeters: number
  estimatedWalkingMinutes: number
}

// Heuristic: Euclidean distance in meters
function heuristic(n1: GraphNode, n2: GraphNode): number {
  const dx = n1.x - n2.x
  const dy = n1.y - n2.y
  return Math.sqrt(dx * dx + dy * dy) * 0.25
}

export function findRoute(startNodeId: string, endNodeId: string): RouteResult | null {
  const startNode = NODES[startNodeId]
  const endNode = NODES[endNodeId]

  if (!startNode || !endNode) return null
  if (startNodeId === endNodeId) {
    return {
      pathNodes: [startNode],
      steps: [],
      totalDistanceMeters: 0,
      estimatedWalkingMinutes: 0
    }
  }

  // Build adjacency map
  const adj = new Map<string, GraphEdge[]>()
  for (const edge of EDGES) {
    if (!adj.has(edge.from)) adj.set(edge.from, [])
    adj.get(edge.from)!.push(edge)
  }

  const openSet = new Set<string>([startNodeId])
  const cameFrom = new Map<string, { prevId: string; edge: GraphEdge }>()

  const gScore = new Map<string, number>()
  gScore.set(startNodeId, 0)

  const fScore = new Map<string, number>()
  fScore.set(startNodeId, heuristic(startNode, endNode))

  while (openSet.size > 0) {
    let currentId = ''
    let lowestF = Infinity

    for (const nodeId of openSet) {
      const f = fScore.get(nodeId) ?? Infinity
      if (f < lowestF) {
        lowestF = f
        currentId = nodeId
      }
    }

    if (currentId === endNodeId) {
      // Reconstruct path
      const pathNodes: GraphNode[] = [NODES[currentId]]
      const steps: RouteStep[] = []
      let curr = currentId
      let totalDist = 0

      while (cameFrom.has(curr)) {
        const { prevId, edge } = cameFrom.get(curr)!
        const fromN = NODES[prevId]
        const toN = NODES[curr]
        pathNodes.unshift(fromN)

        const landmark = toN.landmarkName ? ` near ${toN.landmarkName}` : ''
        const inst = edge.instructions || `Walk toward ${toN.name}${landmark}`

        steps.unshift({
          fromNode: fromN,
          toNode: toN,
          instruction: inst,
          distanceMeters: edge.weight
        })
        totalDist += edge.weight
        curr = prevId
      }

      // Average walking speed ~ 1.3 m/s (~78 m/min)
      const minutes = Math.max(1, Math.ceil(totalDist / 60))

      return {
        pathNodes,
        steps,
        totalDistanceMeters: Math.round(totalDist),
        estimatedWalkingMinutes: minutes
      }
    }

    openSet.delete(currentId)

    const neighbors = adj.get(currentId) || []
    for (const edge of neighbors) {
      const neighborId = edge.to
      const tentativeG = (gScore.get(currentId) ?? Infinity) + edge.weight

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, { prevId: currentId, edge })
        gScore.set(neighborId, tentativeG)
        fScore.set(neighborId, tentativeG + heuristic(NODES[neighborId], endNode))
        openSet.add(neighborId)
      }
    }
  }

  return null
}
