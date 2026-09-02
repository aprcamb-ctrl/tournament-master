import itertools

def generate_4p_matrix():
    # 4 players, 3 rounds
    return [
        ((1, 2), (3, 4)),
        ((1, 3), (2, 4)),
        ((1, 4), (2, 3))
    ]

def generate_5p_matrix():
    # 5 players, 10 rounds based on the user's provided matrix
    return [
        ((1, 2), (3, 4)),  # R1: A&B v C&D (Bye E/5)
        ((3, 5), (1, 4)),  # R2: C&E v A&D (Bye B/2)
        ((2, 4), (1, 5)),  # R3: B&D v A&E (Bye C/3)
        ((1, 3), (2, 5)),  # R4: A&C v B&E (Bye D/4)
        ((2, 3), (4, 5)),  # R5: B&C v D&E (Bye A/1)
        ((1, 2), (4, 5)),  # R6: A&B v D&E (Bye C/3)
        ((1, 3), (2, 4)),  # R7: A&C v B&D (Bye E/5)
        ((2, 5), (3, 4)),  # R8: B&E v C&D (Bye A/1)
        ((1, 4), (3, 5)),  # R9: A&D v C&E (Bye B/2)
        ((1, 5), (2, 3)),  # R10: A&E v B&C (Bye D/4)
    ]

def generate_6p_matrix():
    # 6 players, 15 rounds
    # Each pair appears exactly once. Each player partners exactly twice with everyone.
    return [
        ((1, 5), (2, 3)),
        ((1, 3), (4, 5)),
        ((1, 6), (4, 5)),
        ((1, 2), (5, 6)),
        ((1, 6), (3, 5)),
        ((1, 2), (3, 4)),
        ((2, 3), (4, 6)),
        ((1, 5), (2, 4)),
        ((1, 3), (5, 6)),
        ((2, 5), (4, 6)),
        ((1, 4), (3, 6)),
        ((2, 4), (3, 5)),
        ((1, 4), (2, 6)),
        ((2, 5), (3, 6)),
        ((2, 6), (3, 4))
    ]

def parse_dupr(val):
    if val in (None, "", "NA", "NR"):
        return 0.0
    try:
        return float(val)
    except:
        return 0.0

def get_court_sizes(total_players):
    for x in range(total_players // 6, -1, -1):
        rem = total_players - 6 * x
        if rem % 5 == 0:
            y = rem // 5
            return [6]*x + [5]*y
    return []

def assign_players_to_courts(players, total_courts):
    # Do not sort players by DUPR, preserving manual placement order
    players_sorted = players
    
    total_players = len(players_sorted)
    courts = []
    
    if total_players == 0:
        return courts
        
    has_courts = any(str(p.get('court', '')).strip() for p in players_sorted)
    
    if has_courts:
        # Group players by their explicit court assignment
        from collections import defaultdict
        import re
        
        court_groups = defaultdict(list)
        for p in players_sorted:
            c_val = str(p.get('court', '')).strip()
            if c_val:
                m = re.search(r'\d+', c_val)
                c_idx = int(m.group()) if m else c_val
                court_groups[c_idx].append(p)
            else:
                court_groups['Unassigned'].append(p)
                
        # Sort courts by index
        sorted_keys = sorted(court_groups.keys(), key=lambda x: int(x) if str(x).isdigit() else 999)
        for c_key in sorted_keys:
            c_players = court_groups[c_key]
            courts.append({
                "court_number": c_key,
                "players": c_players,
                "matches": generate_court_matches(c_players)
            })
        return courts

    # Fallback to chunking logic if no explicit courts
    sizes = get_court_sizes(total_players)
    
    # If the exact 5/6 math doesn't work (e.g. 7 players), fallback to old logic
    if not sizes:
        base_size = total_players // total_courts
        remainder = total_players % total_courts
        sizes = [base_size + (1 if i < remainder else 0) for i in range(total_courts)]
        
    start_idx = 0
    for i, size in enumerate(sizes):
        court_players = players_sorted[start_idx:start_idx+size]
        courts.append({
            "court_number": i + 1,
            "players": court_players,
            "matches": generate_court_matches(court_players)
        })
        start_idx += size
        
    return courts

def generate_court_matches(court_players, num_rounds=None):
    size = len(court_players)
    if size == 4:
        matrix = generate_4p_matrix()
    elif size == 5:
        matrix = generate_5p_matrix()
    elif size == 6:
        matrix = generate_6p_matrix()
    else:
        # Fallback for sizes other than 4, 5, or 6
        return []
        
    if num_rounds is None:
        num_rounds = len(matrix)
        
    matches = []
    for round_idx in range(num_rounds):
        match = matrix[round_idx % len(matrix)]
        p1 = court_players[match[0][0] - 1]
        p2 = court_players[match[0][1] - 1]
        p3 = court_players[match[1][0] - 1]
        p4 = court_players[match[1][1] - 1]
        
        matches.append({
            "round": round_idx + 1,
            "team1": [p1, p2],
            "team2": [p3, p4],
            "score1": "",
            "score2": "",
            "verifier1": None,
            "verifier2": None
        })
    return matches
