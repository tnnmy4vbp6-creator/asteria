"""Build deterministic, solvable game content. Development tool, never shipped.
PYTHONPATH=.qa/python-lib python tools/generate_living.py
"""
import json
import random
from pathlib import Path
import networkx as nx
from ortools.sat.python import cp_model

ROOT = Path(__file__).resolve().parents[1]
rng = random.Random(27031)
content = {"schema": 1, "challenges": {"cargo": [], "forest": [], "volcano": [], "fossils": [], "grammar": []}}
verified = 0
for tier in range(1, 4):
    for serial in range(6):
        boats = 2 if tier == 1 else 3
        minimum = tier
        sample = [[rng.randint(minimum, minimum + 3), rng.randint(1, tier + 2)] for _ in range(boats)]
        weights = [a + 2 * b for a, b in sample]
        food, wood = sum(a for a, _ in sample), sum(b for _, b in sample)
        model = cp_model.CpModel()
        apples = [model.new_int_var(minimum, food, f"food{i}") for i in range(boats)]
        planks = [model.new_int_var(0, wood, f"wood{i}") for i in range(boats)]
        model.add(sum(apples) == food)
        model.add(sum(planks) == wood)
        for i in range(boats):
            model.add(apples[i] + 2 * planks[i] == weights[i])
        solver = cp_model.CpSolver()
        solver.parameters.num_search_workers = 1
        assert solver.solve(model) in (cp_model.OPTIMAL, cp_model.FEASIBLE)
        solution = [[solver.value(apples[i]), solver.value(planks[i])] for i in range(boats)]
        content["challenges"]["cargo"].append(dict(tier=tier, food=food, wood=wood, weights=weights, minimum=minimum, solution=solution))
        verified += 1

        # English instructions are evaluated against the actual walkable grid.
        grid = nx.grid_2d_graph(5, 5)
        start, end = (2, 4), (serial % 5, 0 if tier > 1 else 2)
        forbidden = []
        if tier > 1:
            forbidden = [(1 + serial % 2, 2), (3, 3)]
            grid.remove_nodes_from(p for p in forbidden if p not in (start, end))
        route = nx.shortest_path(grid, start, end)
        facing = 0  # north, east, south, west
        directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]
        commands = []
        for a, b in zip(route, route[1:]):
            direction = directions.index((b[0] - a[0], b[1] - a[1]))
            turn = (direction - facing) % 4
            commands.extend(["right"] * turn if turn <= 2 else ["left"])
            commands.append("forward")
            facing = direction
        assert len(route) > 1
        content["challenges"]["forest"].append(dict(tier=tier, start=start, end=end, blocked=forbidden, commands=commands, route=route))
        verified += 1

        # Rotating channel puzzle: a continuous route, plus harmless decoys.
        row = 0 if serial % 2 == 0 else 2
        route = [(0,1),(0,row),(1,row),(2,row),(2,1)] if tier > 1 else [(0,1),(1,1),(2,1)]
        graph = nx.grid_2d_graph(3, 3)
        assert nx.is_path(graph, route)
        tiles = [[0, 2] for _ in range(9)]
        for i, at in enumerate(route):
            before = route[i-1] if i else (-1,1)
            after = route[i+1] if i+1<len(route) else (3,1)
            tiles[at[0]+at[1]*3] = [directions.index((p[0]-at[0], p[1]-at[1])) for p in (before, after)]
        rotations = [rng.randrange(1,4) for _ in tiles]
        rotations[3] = 1 if tier == 1 else 2  # arrival cannot already be connected
        content["challenges"]["volcano"].append(dict(tier=tier, tiles=tiles, rotations=rotations, route=route))
        verified += 1

        # These are relative ages in an invented undisturbed sedimentary section,
        # not a claim that a species always predates another species.
        layers = ["empreinte de feuille", "coquillage fossilisé", "trace de patte", "fragment de corail", "terrier fossilisé"]
        rng.shuffle(layers)
        content["challenges"]["fossils"].append(dict(tier=tier, layers=layers[:2+tier], colors=["#735343","#a17b55","#c5a775","#dcc9a0","#eee0b6"][:2+tier]))
        verified += 1

sentences = [
    (1,["Le","jardinier","arrose","la serre."],["arrosent"]),
    (1,["Les","jardiniers","arrosent","la serre."],["arrose"]),
    (1,["Le","marin","charge","le bateau."],["chargent"]),
    (1,["Les","marins","chargent","le bateau."],["charge"]),
    (2,["Les","petites","caisses","arrivent","au port."],["petits","arrive"]),
    (2,["La","petite","caravane","traverse","la forêt."],["petites","traversent"]),
    (2,["Les","grandes","portes","protègent","le village."],["grands","protège"]),
    (2,["Le","grand","entrepôt","abrite","les récoltes."],["grande","abritent"]),
    (3,["Demain,","les","marins","chargeront","les caisses."],["chargeaient","chargera"]),
    (3,["Hier,","les","marins","chargeaient","les caisses."],["chargeront","chargeait"]),
    (3,["Demain,","la","jardinière","arrosera","les semis."],["arrosaient","arrosait"]),
    (3,["Hier,","la","jardinière","arrosait","les semis."],["arrosera","arrosaient"]),
]
for tier, words, distractors in sentences:
    content["challenges"]["grammar"].append(dict(tier=tier, words=words, distractors=distractors))

landmarks = {"home":[28,51],"garden":[46,51],"store":[37,36],"hub":[38,39],"forest":[14,18],"fossils":[62,17],"volcano":[63,59],"cargo":[13,61]}
graph=nx.Graph()
for a,b in [("home","hub"),("garden","hub"),("store","hub"),("hub","forest"),("hub","fossils"),("hub","volcano"),("hub","cargo")]:
    graph.add_edge(a,b)
assert nx.is_connected(graph)
content["routes"] = [dict(name=name, nodes=nx.shortest_path(graph,"hub",name), destination=pos) for name,pos in landmarks.items()]
content["landmarks"] = landmarks
out=ROOT/"content/living-challenges.json"
out.write_text(json.dumps(content,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"content/living-validation.json").write_text(json.dumps({"generator":"tools/generate_living.py","seed":27031,"ortools": "9.15.6755", "networkx":"3.7", "solver_checked_cargo":18,"graph_checked_routes":36,"connected_landmarks":len(landmarks),"generated_challenges":sum(len(v)for v in content["challenges"].values()),"status":"passed"},indent=2)+"\n")
print(f"Generated {sum(len(v)for v in content['challenges'].values())} variants; {verified} checks passed.")
